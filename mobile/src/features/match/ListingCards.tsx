import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OpponentListing, PlayerListing } from './api';
import { formatDayLabel, formatTimeLabel } from './constants';
import { shareListing } from './shareListing';
import { POSITIONS } from '@/features/auth/PitchPositionPicker';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function positionLabel(Key: string): string {
  return POSITIONS.find((Position) => Position.key === Key)?.label ?? Key;
}

const APPLY_LABELS = {
  pending: 'Beklemede',
  approved: 'Kadrodasın',
  rejected: 'Reddedildi',
} as const;

type PlayerListingCardProps = {
  listing: PlayerListing;
  onApply: () => void;
};

/** Adam-eksik ilan kartı — Keşfet ve feed'de aynı görünüm/işlev. */
export function PlayerListingCard({ listing, onApply }: PlayerListingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flexShrink}>
          <Text style={styles.cardTitle}>{listing.match?.team_name ?? 'Takım'}</Text>
          <Text style={styles.cardMeta}>
            {listing.match != null
              ? `${formatDayLabel(listing.match.starts_at)} · ${formatTimeLabel(listing.match.starts_at)} · ${listing.match.venue_text}`
              : ''}
          </Text>
        </View>
        <View style={styles.cardTopRight}>
          {listing.distance_km != null && (
            <Text style={styles.distance}>{listing.distance_km} km</Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => shareListing('player', listing.id)}
            hitSlop={8}>
            <Ionicons name="share-outline" size={18} color={Palette.moss} />
          </Pressable>
        </View>
      </View>

      <View style={styles.chipRow}>
        {listing.positions_needed.map((Position) => (
          <View key={Position} style={styles.positionChip}>
            <Text style={styles.positionChipText}>{positionLabel(Position)}</Text>
          </View>
        ))}
        <View style={styles.positionChip}>
          <Text style={styles.positionChipText}>
            Seviye {listing.level_min}-{listing.level_max}
          </Text>
        </View>
        <View style={styles.positionChip}>
          <Text style={styles.positionChipText}>{listing.needed_count} kişi</Text>
        </View>
      </View>

      {listing.my_application_status != null ? (
        <View style={styles.appliedBadge}>
          <Text style={styles.appliedText}>{APPLY_LABELS[listing.my_application_status]}</Text>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={onApply} style={styles.applyButton}>
          <Text style={styles.applyText}>Başvur</Text>
        </Pressable>
      )}
    </View>
  );
}

type OpponentListingCardProps = {
  listing: OpponentListing;
  onMatch: () => void;
};

/** Rakip-arıyor ilan kartı — Keşfet ve feed'de aynı görünüm/işlev. */
export function OpponentListingCard({ listing, onMatch }: OpponentListingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, styles.flexShrink]}>{listing.team?.name ?? 'Takım'}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => shareListing('opponent', listing.id)}
          hitSlop={8}>
          <Ionicons name="share-outline" size={18} color={Palette.moss} />
        </Pressable>
      </View>
      {listing.match != null && (
        <Text style={styles.cardMeta}>
          {formatDayLabel(listing.match.starts_at)} · {formatTimeLabel(listing.match.starts_at)} ·{' '}
          {listing.match.venue_text} · {listing.match.format}v{listing.match.format}
        </Text>
      )}
      {listing.note != null && <Text style={styles.note}>{listing.note}</Text>}

      {listing.status === 'open' ? (
        <Pressable accessibilityRole="button" onPress={onMatch} style={styles.applyButton}>
          <Text style={styles.applyText}>Maç yapalım</Text>
        </Pressable>
      ) : (
        <View style={styles.appliedBadge}>
          <Text style={styles.appliedText}>Eşleşti</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space(3),
  },
  cardTopRight: {
    alignItems: 'flex-end',
    gap: space(2),
  },
  flexShrink: {
    flexShrink: 1,
  },
  cardTitle: {
    fontFamily: Type.displaySemi,
    fontSize: 19,
    color: Palette.chalk,
  },
  cardMeta: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  distance: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.lime,
  },
  note: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
    marginTop: space(2),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    marginTop: space(3),
  },
  positionChip: {
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: space(2),
  },
  positionChipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.chalk,
  },
  applyButton: {
    marginTop: space(3),
    backgroundColor: Palette.lime,
    borderRadius: Radius.pill,
    paddingVertical: space(2),
    alignItems: 'center',
  },
  applyText: {
    fontFamily: Type.displaySemi,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Palette.limeInk,
  },
  appliedBadge: {
    marginTop: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingVertical: space(2),
    alignItems: 'center',
  },
  appliedText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
});
