import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GlassView } from '@/shared/ui/GlassView';
import { Palette, Radius, space } from '@/shared/ui/theme';

const TAB_HEIGHT = 54;
/** Camın içinden "oyulmuş" gibi görünen delik — ekran zemini rengiyle boyanır. */
const HOLE_SIZE = 72;
/** Deliğin içini dolduran limon düğme. */
const BUTTON_SIZE = 54;
/** İki şeklin de ortaklaşa hizalandığı, üst kenara göre dikey merkez (negatifse çubuğun üstüne taşar). */
const NOTCH_CENTER_Y = 4;
/** Aktif ikonun, normal sıra hizasından bu düğmenin merkezine kadar yükseldiği mesafe. */
const ICON_LIFT = NOTCH_CENTER_Y - (space(3) + TAB_HEIGHT / 2);

/** Yay animasyonunun sekmeler arası geçişte fazla sıçramaması için sıkı sönümleme. */
const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.7, overshootClamping: true };

/**
 * Alt sekme çubuğu (BACKLOG #59): referans görseldeki gibi, aktif sekmenin
 * üstünde çubuğun kendi zemininden "oyulmuş" bir delik ve içinde limon
 * renginde, ikonu taşıyan yükseltilmiş bir düğme var. İkisi de aynı
 * `CenterX` shared value'suyla, `overshootClamping` sayesinde sıçramadan tek
 * yönde bir sonraki sekmeye kayıyor. BACKLOG #43'teki liquid glass zemin
 * korunur; ikonlar her `Tabs.Screen`'in kendi `tabBarIcon`'undan gelir
 * (aktif/pasif ikon seçimini oradaki `focused` parametresi belirler).
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

  const HoleStyle = useAnimatedStyle(() => ({
    opacity: IndicatorOpacity.value,
    transform: [{ translateX: CenterX.value - HOLE_SIZE / 2 }],
  }));

  const ButtonStyle = useAnimatedStyle(() => ({
    opacity: IndicatorOpacity.value,
    transform: [{ translateX: CenterX.value - BUTTON_SIZE / 2 }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space(3)) }]}>
      <GlassView style={StyleSheet.absoluteFillObject} intensity={60} />
      <Animated.View pointerEvents="none" style={[styles.hole, HoleStyle]} />
      <Animated.View pointerEvents="none" style={[styles.button, ButtonStyle]} />
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
              hitSlop={{ top: 30 }}
              accessibilityRole="button"
              accessibilityState={IsFocused ? { selected: true } : {}}
              accessibilityLabel={typeof options.title === 'string' ? options.title : Route.name}
              style={styles.tab}>
              <View style={IsFocused && styles.iconLifted}>
                {options.tabBarIcon?.({
                  focused: IsFocused,
                  color: IsFocused ? Palette.limeInk : Palette.moss,
                  size: IsFocused ? 24 : 22,
                })}
              </View>
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
    // GlassView kendi overflow'unu yönetiyor; burada gizlemiyoruz ki delik/
    // düğme üst kenarın üstüne taşabilsin.
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
    height: TAB_HEIGHT,
  },
  iconLifted: {
    transform: [{ translateY: ICON_LIFT }],
  },
  /** Çubuğun zemininden oyulmuş delik — ekranın kendi zemin rengiyle boyanır. */
  hole: {
    position: 'absolute',
    top: NOTCH_CENTER_Y - HOLE_SIZE / 2,
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Palette.pitchNight,
  },
  /** Deliğin içindeki, ikonu taşıyan yükseltilmiş limon düğme. */
  button: {
    position: 'absolute',
    top: NOTCH_CENTER_Y - BUTTON_SIZE / 2,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    shadowColor: Palette.lime,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
