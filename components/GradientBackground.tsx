import React, { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';

type Props = PropsWithChildren<{ style?: ViewStyle; isDark?: boolean }>;

export function GradientBackground({ children, style, isDark = true }: Props) {
  const colors = isDark 
    ? ['#0b1020', '#0a0e1a', '#070a12']
    : ['#F3F4F6', '#F3F4F6', '#F3F4F6'];
  
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}




