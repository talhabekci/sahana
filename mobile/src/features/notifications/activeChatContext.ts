type ActiveChat = { teamId?: string; dmUserId?: string };

let Current: ActiveChat | null = null;

/** Bir sohbet ekranı fokuslanınca/fokustan çıkınca çağrılır. */
export function setActiveChat(Context: ActiveChat | null): void {
  Current = Context;
}

/**
 * Gelen bir push bildiriminin (chat_message tipinde) verisi, o an açık olan
 * sohbet ekranıyla eşleşiyor mu — eşleşiyorsa bildirim zaten ekranda canlı
 * göründüğü için tekrar göstermeye gerek yok (BACKLOG #67).
 */
export function isViewingChat(Data: Record<string, unknown>): boolean {
  if (Current == null) {
    return false;
  }

  if (typeof Data.team_id === 'string' && Data.team_id === Current.teamId) {
    return true;
  }

  return typeof Data.dm_user_id === 'string' && Data.dm_user_id === Current.dmUserId;
}
