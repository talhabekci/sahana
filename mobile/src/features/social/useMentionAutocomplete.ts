import { useRef, useState } from 'react';
import { type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';

import { PublicPlayer, searchPlayers } from './api';

type MentionedUser = { id: string; name: string };

/**
 * @kullaniciadi etiketleme (BACKLOG #72) — imleç ".../@partial" ile bitiyorsa
 * (metnin en sonunda değilse arama tetiklenmez, en yaygın kullanım metni
 * ileri doğru yazmak olduğu için bu basitleştirme yeterli) `/search`
 * üzerinden oyuncu önerisi getirir. Seçilince metne `@Ad Soyad ` eklenir,
 * gönderirken sadece metinde hâlâ geçen etiketler `mentioned_user_ids`
 * olarak yollanır (kullanıcı silmiş olabilir).
 */
export function useMentionAutocomplete(Body: string, setBody: (Value: string) => void) {
  const [Suggestions, setSuggestions] = useState<PublicPlayer[]>([]);
  const MentionedRef = useRef<MentionedUser[]>([]);
  const CursorRef = useRef(Body.length);
  const SearchTokenRef = useRef(0);

  function currentMentionQuery(Text: string, Cursor: number): string | null {
    const Match = /@(\w*)$/.exec(Text.slice(0, Cursor));

    return Match?.[1] ?? null;
  }

  function onSelectionChange(Event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    CursorRef.current = Event.nativeEvent.selection.start;
  }

  function onChangeText(Value: string) {
    setBody(Value);

    const Query = currentMentionQuery(Value, CursorRef.current);

    if (Query == null) {
      setSuggestions([]);

      return;
    }

    const Token = ++SearchTokenRef.current;

    void searchPlayers(Query).then((Results) => {
      if (Token === SearchTokenRef.current) {
        setSuggestions(Results.slice(0, 6));
      }
    });
  }

  function selectSuggestion(Player: PublicPlayer) {
    if (Player.name == null) {
      return;
    }

    const Cursor = CursorRef.current;
    const Before = Body.slice(0, Cursor).replace(/@\w*$/, `@${Player.name} `);
    const After = Body.slice(Cursor);
    const NextBody = Before + After;

    MentionedRef.current = [
      ...MentionedRef.current.filter((Existing) => Existing.id !== Player.id),
      { id: Player.id, name: Player.name },
    ];
    setSuggestions([]);
    setBody(NextBody);
    CursorRef.current = Before.length;
  }

  /** Gönderirken çağrılır — metinde artık geçmeyen (silinmiş) etiketleri eler. */
  function resolveMentionedUserIds(FinalBody: string): string[] {
    return MentionedRef.current
      .filter((Mentioned) => FinalBody.includes(`@${Mentioned.name}`))
      .map((Mentioned) => Mentioned.id);
  }

  return { Suggestions, onChangeText, onSelectionChange, selectSuggestion, resolveMentionedUserIds };
}
