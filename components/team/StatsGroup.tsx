import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';
import { StatRow } from './StatRow';

interface StatsGroupProps {
  title: string;
  data: Record<string, number | string | undefined>;
  theme?: { colors: ThemeColors };
}

/**
 * Converts camelCase to Title Case
 * Example: "goalsScored" -> "Goals Scored"
 */
const camelCaseToTitleCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
    .trim();
};

export const StatsGroup: React.FC<StatsGroupProps> = ({ title, data, theme }) => {
  // Guard clause: Don't render if data is missing or invalid
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Use theme colors - require theme to be passed, no fallbacks that force colors
  if (!theme?.colors) {
    console.warn('StatsGroup: theme prop is required');
    return null;
  }
  
  const backgroundColor = theme.colors.cardBackground;
  const titleColor = theme.colors.text;
  const borderColor = theme.colors.separator;

  // Format values appropriately (e.g., percentages)
  const formatValue = (key: string, value: number | string | undefined): string | number => {
    if (value === undefined || value === null) return '-';
    
    // Format percentage values
    if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('accuracy')) {
      if (typeof value === 'number') {
        return `${value.toFixed(1)}%`;
      }
      if (typeof value === 'string' && !value.includes('%')) {
        return `${value}%`;
      }
    }
    
    return value;
  };

  // Filter out undefined/null values and get entries
  const entries = Object.entries(data)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, formatValue(key, value)]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor,
      borderColor,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    }]}>
      <Text style={[styles.title, { color: titleColor }]}>
        {title}
      </Text>
      <View style={styles.content}>
        {entries.map(([key, value], index) => (
          <View
            key={key}
            style={[
              index < entries.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
            ]}
          >
            <StatRow
              label={camelCaseToTitleCase(key)}
              value={value}
              theme={theme}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    overflow: 'hidden',
  },
});

export default StatsGroup;

