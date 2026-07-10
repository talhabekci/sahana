import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Alert } from 'react-native';

import type { OpponentListing } from './api';
import { applyToListing, matchOpponentListing } from './api';
import { listTeams } from '@/features/team/api';
import { toApiFailure } from '@/shared/api/client';

/**
 * Adam-eksik/rakip-arayan ilan kartlarının ("Başvur"/"Maç yapalım") ortak
 * mutation mantığı — Keşfet ve feed'de aynı davranış (kod tekrarı yok).
 */
export function useListingActions() {
  const QueryClient = useQueryClient();
  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });

  const MyCaptainTeams = useMemo(
    () => (Teams.data ?? []).filter((Team) => Team.my_role === 'captain'),
    [Teams.data],
  );

  const invalidate = () => {
    void QueryClient.invalidateQueries({ queryKey: ['discover'] });
    void QueryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const Apply = useMutation({
    mutationFn: (listingId: string) => applyToListing(listingId),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const MatchOpponent = useMutation({
    mutationFn: ({ listingId, teamId }: { listingId: string; teamId: string }) =>
      matchOpponentListing(listingId, teamId),
    onSuccess: () => {
      invalidate();
      Alert.alert('Eşleşti!', 'Maç detayında rakip olarak görünüyorsunuz.');
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const promptOpponentMatch = (Listing: OpponentListing) => {
    if (MyCaptainTeams.length === 0) {
      Alert.alert('Takım gerekli', 'Rakip olmak için kaptanı olduğun bir takım gerekiyor.');

      return;
    }

    Alert.alert('Maç yapalım', `${Listing.team?.name ?? 'Bu takım'} ile eşleşilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      ...MyCaptainTeams.map((Team) => ({
        text: Team.name,
        onPress: () => MatchOpponent.mutate({ listingId: Listing.id, teamId: Team.id }),
      })),
    ]);
  };

  return {
    apply: (listingId: string) => Apply.mutate(listingId),
    promptOpponentMatch,
  };
}
