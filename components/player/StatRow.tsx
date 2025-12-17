import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';

interface StatRowProps {
  label: string;
  value: string | number;
  isLast?: boolean;
  isDark?: boolean;
  theme?: { colors: ThemeColors };
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, isLast = false, isDark = true, theme }) => {
  const borderColor = theme?.colors?.separator || '#222F4E';
  const textColor = theme?.colors?.text || '#ffffff';

  return (
    <View style={[styles.container, !isLast && [styles.withBorder, { borderBottomColor: borderColor }]]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  withBorder: {
    borderBottomWidth: 1,
  },
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
  },
  value: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
  },
});

export default StatRow;

