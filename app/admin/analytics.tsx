import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

const analyticsData = [
  { value: 1200, label: 'Users', frontColor: '#22c55e' },
  { value: 85, label: 'Matches', frontColor: '#3b82f6' },
  { value: 560, label: 'Bids', frontColor: '#f59e0b' },
];

export default function AdminAnalytics() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Card style={{ backgroundColor: Colors[colorScheme].card }}>
        <Card.Title title="Analytics Overview" />
        <Card.Content>
          {analyticsData && analyticsData.length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={analyticsData}
                width={CHART_WIDTH}
                height={220}
                barWidth={50}
                spacing={40}
                initialSpacing={30}
                endSpacing={30}
                barBorderTopLeftRadius={6}
                barBorderTopRightRadius={6}
                noOfSections={5}
                maxValue={1500}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisColor={isDark ? '#374151' : '#e5e7eb'}
                xAxisColor={isDark ? '#374151' : '#e5e7eb'}
                yAxisTextStyle={[
                  styles.axisLabel,
                  { color: isDark ? '#9ca3af' : '#6b7280' },
                ]}
                xAxisLabelTextStyle={[
                  styles.axisLabel,
                  { color: isDark ? '#9ca3af' : '#6b7280' },
                ]}
                hideRules={false}
                rulesColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                rulesType="solid"
                yAxisLabelWidth={45}
                showValuesAsTopLabel
                topLabelTextStyle={[
                  styles.topLabel,
                  { color: isDark ? '#fff' : '#0f172a' },
                ]}
                disablePress
              />
            </View>
          ) : (
            <Text style={{ color: Colors[colorScheme].text }}>No data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        {analyticsData.map((item, index) => (
          <Card
            key={index}
            style={[styles.statCard, { backgroundColor: Colors[colorScheme].card }]}
          >
            <Card.Content style={styles.statContent}>
              <Text
                style={[styles.statValue, { color: item.frontColor }]}
              >
                {item.value.toLocaleString()}
              </Text>
              <Text
                style={[styles.statLabel, { color: Colors[colorScheme].muted }]}
              >
                {item.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  axisLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  topLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
});
