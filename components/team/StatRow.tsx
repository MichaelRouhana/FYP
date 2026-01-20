import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';

interface StatRowProps {
  label: string;
  value: string | number;
  theme?: { colors: ThemeColors };
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, theme }) => {
  // Use theme colors - require theme to be passed
  if (!theme?.colors) {
    console.warn('StatRow: theme prop is required');
    return null;
  }
  
  const labelColor = theme.colors.textSecondary;
  const valueColor = theme.colors.text;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor }]}>
        {String(value)}
      </Text>
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
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
  },
  value: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
});

export default StatRow;

