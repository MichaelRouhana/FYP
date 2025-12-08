import React, { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';

type Props = PropsWithChildren<{ style?: ViewStyle }>;

export function GradientBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={['#0b1020', '#0a0e1a', '#070a12']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}




