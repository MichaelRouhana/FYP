import React, { PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Props = PropsWithChildren<{ color: string }>;

export function GlowBadge({ children, color }: Props) {
  const glow = useSharedValue(0.6);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    shadowColor: color,
    shadowOpacity: glow.value,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  }));
  return (
    <Animated.View style={style}>
      <Chip compact style={{ backgroundColor: color }} textStyle={{ color: 'white' }}>{children}</Chip>
    </Animated.View>
  );
}




