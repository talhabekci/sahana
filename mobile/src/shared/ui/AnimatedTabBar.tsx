import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GlassView } from '@/shared/ui/GlassView';
import { Palette, Radius, space } from '@/shared/ui/theme';

const PILL_SIZE = 46;
const NOTCH_WIDTH = 32;
const NOTCH_HEIGHT = 5;

/** Yay animasyonunun sekmeler arası geçişte fazla sıçramaması için sıkı sönümleme. */
const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.7, overshootClamping: true };

/**
 * Alt sekme çubuğu (BACKLOG #59): aktif sekmenin altında limon renginde bir
 * "pill" ve üst kenarda kayan bir "çentik" (notch) aynı anda animasyonla
 * bir sonraki sekmeye geçer (`overshootClamping` ile sıçrama/sallanma
 * olmadan tek yönde kayar). BACKLOG #43'teki liquid glass zemini korunur;
 * ikonlar her `Tabs.Screen`'in kendi `tabBarIcon`'undan gelir (aktif/pasif
 * ikon seçimini oradaki `focused` parametresi belirler).
 */
export function AnimatedTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const [TabCenters, setTabCenters] = useState<Record<number, number>>({});
  const CenterX = useSharedValue(0);
  const IndicatorOpacity = useSharedValue(0);
  const HasPositioned = useRef(false);

  useEffect(() => {
    const TargetCenterX = TabCenters[state.index];

    if (TargetCenterX == null) {
      return;
    }

    if (!HasPositioned.current) {
      CenterX.value = TargetCenterX;
      IndicatorOpacity.value = withTiming(1, { duration: 150 });
      HasPositioned.current = true;
    } else {
      CenterX.value = withSpring(TargetCenterX, SPRING_CONFIG);
    }
  }, [state.index, TabCenters, CenterX, IndicatorOpacity]);

  const PillStyle = useAnimatedStyle(() => ({
    opacity: IndicatorOpacity.value,
    transform: [{ translateX: CenterX.value - PILL_SIZE / 2 }],
  }));

  const NotchStyle = useAnimatedStyle(() => ({
    opacity: IndicatorOpacity.value,
    transform: [{ translateX: CenterX.value - NOTCH_WIDTH / 2 }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space(3)) }]}>
      <GlassView style={StyleSheet.absoluteFillObject} intensity={60} />
      <Animated.View pointerEvents="none" style={[styles.notch, NotchStyle]} />
      <Animated.View pointerEvents="none" style={[styles.pill, PillStyle]} />
      <View style={styles.row}>
        {state.routes.map((Route, Index) => {
          const { options } = descriptors[Route.key];
          const IsFocused = state.index === Index;

          const onPress = () => {
            const Event = navigation.emit({
              type: 'tabPress',
              target: Route.key,
              canPreventDefault: true,
            });

            if (!IsFocused && !Event.defaultPrevented) {
              navigation.navigate(Route.name);
            }
          };

          const onLayout = (LayoutEvent: LayoutChangeEvent) => {
            const { x, width } = LayoutEvent.nativeEvent.layout;

            setTabCenters((Prev) => ({ ...Prev, [Index]: x + width / 2 }));
          };

          return (
            <Pressable
              key={Route.key}
              onLayout={onLayout}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={IsFocused ? { selected: true } : {}}
              accessibilityLabel={typeof options.title === 'string' ? options.title : Route.name}
              style={styles.tab}>
              {options.tabBarIcon?.({
                focused: IsFocused,
                color: IsFocused ? Palette.limeInk : Palette.moss,
                size: IsFocused ? 24 : 22,
              })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // GlassView kendi overflow'unu yönetiyor; burada gizlemiyoruz ki notch
    // üst kenarın üstüne taşabilsin.
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: space(3),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_SIZE,
  },
  pill: {
    position: 'absolute',
    top: space(3),
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    shadowColor: Palette.lime,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  /** Aktif sekmeyi işaretleyen, üst kenarın üstüne taşan "çentik". */
  notch: {
    position: 'absolute',
    top: -NOTCH_HEIGHT / 2,
    width: NOTCH_WIDTH,
    height: NOTCH_HEIGHT,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    shadowColor: Palette.lime,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
