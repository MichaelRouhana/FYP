// components/dashboard/DashboardChart.tsx
// Reusable Chart Component for Dashboard

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface DashboardChartProps {
  title: string;
  data: Array<{ value: number; label: string }>;
  color: string;
  badgeValue?: string; // Optional percentage badge
  bigNumber?: number; // Optional big number to display
}

export default function DashboardChart({
  title,
  data,
  color,
  badgeValue,
  bigNumber,
}: DashboardChartProps) {
  const { theme, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Account for padding

  // Calculate dynamic max value from actual data
  const maxDataValue = Math.max(...data.map(item => item.value), 1);
  // Round up to next "nice" number with 20% padding
  const chartCeiling = Math.ceil(maxDataValue + (maxDataValue * 0.2));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
          {bigNumber !== undefined && (
            <Text style={[styles.bigNumber, { color: theme.colors.text }]}>{bigNumber.toLocaleString()}</Text>
          )}
        </View>
        {badgeValue && (
          <View style={styles.badgeContainer}>
            <Ionicons name="ellipse" size={6} color={color} />
            <Text style={[styles.badgeText, { color: theme.colors.text }]}>{badgeValue}</Text>
          </View>
        )}
      </View>
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          areaChart={true}
          curved={false}
          maxValue={chartCeiling}
          noOfSections={4}
          height={180}
          width={chartWidth}
          spacing={44}
          initialSpacing={10}
          color={color}
          thickness={2}
          hideDataPoints={true}
          startFillColor={color}
          endFillColor={isDark ? '#1F2937' : '#F3F4F6'}
          startOpacity={0.4}
          endOpacity={0.0}
          yAxisColor="transparent"
          xAxisColor="transparent"
          yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10, marginTop: 6 }}
          rulesType="dashed"
          rulesColor={theme.colors.separator}
          hideRules={false}
          showVerticalLines={true}
          verticalLinesColor={theme.colors.separator}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
  chartWrapper: {
    marginLeft: -10,
    overflow: 'hidden',
  },
});

