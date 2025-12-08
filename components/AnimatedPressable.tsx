import React, { PropsWithChildren } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';

type AnimatedPressableProps = PressableProps & {
  scaleTo?: number;
};

export function AnimatedPressable({ children, scaleTo = 0.97, ...props }: PropsWithChildren<AnimatedPressableProps>) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={(e) => {
          props.onPressIn?.(e);
          scale.value = withTiming(scaleTo, { duration: 80, easing: Easing.out(Easing.quad) });
        }}
        onPressOut={(e) => {
          props.onPressOut?.(e);
          scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}




