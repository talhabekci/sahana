import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { GlassView } from '@/shared/ui/GlassView';
import { Palette, Radius, space } from '@/shared/ui/theme';

const TAB_HEIGHT = 54;
/** İkonun sıradaki sabit dikey merkezi — hem ikon hem delik/düğme buna göre hizalanır, ikon ASLA yer değiştirmez. */
const ROW_CENTER_Y = space(3) + TAB_HEIGHT / 2;
/** Camın içinden "oyulmuş" gibi görünen delik — ekran zemini rengiyle boyanır. */
const HOLE_SIZE = 72;
/** Deliğin içini dolduran limon düğme. */
const BUTTON_SIZE = 54;

/** Yay animasyonunun sekmeler arası geçişte fazla sıçramaması için sıkı sönümleme. */
const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.7, overshootClamping: true };

/**
 * Alt sekme çubuğu (BACKLOG #59): aktif sekmenin ikonu HİÇBİR ZAMAN yer
 * değiştirmez — sadece arkasındaki delik+düğme (çubuğun zemininden
 * "oyulmuş" gibi görünen daire + içindeki limon düğme) yatayda bir sonraki
 * sekmeye kayar. İkisi de aynı `CenterX` shared value'suyla,
 * `overshootClamping` sayesinde sıçramadan tek yönde kayar. BACKLOG
 * #43'teki liquid glass zemin korunur; ikonlar her `Tabs.Screen`'in kendi
 * `tabBarIcon`'undan gelir (aktif/pasif ikon seçimini oradaki `focused`
 * parametresi belirler).
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
  /** Çubuğun zemininden oyulmuş delik — ekranın kendi zemin rengiyle boyanır. */
  hole: {
    position: 'absolute',
    top: ROW_CENTER_Y - HOLE_SIZE / 2,
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Palette.pitchNight,
  },
  /** Deliğin içindeki, sabit duran ikonun arkasındaki limon düğme. */
  button: {
    position: 'absolute',
    top: ROW_CENTER_Y - BUTTON_SIZE / 2,
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
