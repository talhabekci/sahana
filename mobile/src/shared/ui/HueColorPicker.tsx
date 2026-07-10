import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { hexToHue, hslToHex } from '@/features/team/constants';
import { Palette, Radius } from './theme';

const THUMB_SIZE = 26;
const SEGMENTS = 48;
const SATURATION = 0.78;
const LIGHTNESS = 0.6;

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

/**
 * Sürekli ton (hue) seçici — sabit swatch listesi yerine kullanıcı tam
 * renk yelpazesinden istediği tonu sürükleyerek/dokunarak seçer
 * (BACKLOG.md #36). `react-native-svg` gibi ek bir native bağımlılık
 * gerektirmesin diye gradyan çok sayıda ince View segmentiyle simüle
 * ediliyor — mevcut dev-client build'inde çalışır, yeni rebuild gerekmez.
 */
export function HueColorPicker({ value, onChange }: Props) {
  const [TrackWidth, setTrackWidth] = useState(0);
  const ThumbX = useSharedValue(0);

  const handleLayout = (Event: LayoutChangeEvent) => {
    const Width = Event.nativeEvent.layout.width;
    setTrackWidth(Width);
    ThumbX.value = (hexToHue(value) / 360) * Width;
  };

  const commit = (X: number, Width: number) => {
    if (Width <= 0) {
      return;
    }

    const Hue = Math.max(0, Math.min(360, (X / Width) * 360));
    onChange(hslToHex(Hue, SATURATION, LIGHTNESS));
  };

  const Pan = Gesture.Pan()
    .onBegin((Event) => {
      const NewX = Math.max(0, Math.min(TrackWidth, Event.x));
      ThumbX.value = NewX;
      runOnJS(commit)(NewX, TrackWidth);
    })
    .onChange((Event) => {
      const NewX = Math.max(0, Math.min(TrackWidth, Event.x));
      ThumbX.value = NewX;
      runOnJS(commit)(NewX, TrackWidth);
    });

  const ThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ThumbX.value - THUMB_SIZE / 2 }],
  }));

  return (
    <GestureDetector gesture={Pan}>
      <View style={styles.track} onLayout={handleLayout}>
        <View style={styles.segments}>
          {Array.from({ length: SEGMENTS }, (_, Index) => (
            <View
              key={Index}
              style={[
                styles.segment,
                { backgroundColor: hslToHex((Index / SEGMENTS) * 360, SATURATION, LIGHTNESS) },
              ]}
            />
          ))}
        </View>
        <Animated.View style={[styles.thumb, ThumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 40,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  segments: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: Palette.chalk,
    backgroundColor: 'transparent',
  },
});
