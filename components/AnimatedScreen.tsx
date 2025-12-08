import React, { PropsWithChildren } from 'react';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

export function AnimatedScreen({ children }: PropsWithChildren<{}>) {
  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}




