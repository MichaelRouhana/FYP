import { CHART_COLORS, TIME_PERIODS } from '@/mock/matchPower/constants';
import { GoalPowerData, GoalsByMinute } from '@/mock/matchPower/types';
import React, { useMemo } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface GoalPowerChartProps {
  data: GoalPowerData | null | undefined;
  homeColor?: string;
  awayColor?: string;
  isDark?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

// Transform API-Football style data to chart format
const transformToChartData = (
  homeGoals: GoalsByMinute | undefined,
  awayGoals: GoalsByMinute | undefined,
  homeColor: string,
  awayColor: string
): any[] => {
  if (!homeGoals || !awayGoals) return [];
  
  const chartData: any[] = [];
  
  TIME_PERIODS.forEach((period, index) => {
    const homeValue = homeGoals[period]?.total ?? 0;
    const awayValue = awayGoals[period]?.total ?? 0;
    
    // Home team bar
    chartData.push({
      value: homeValue,
      frontColor: homeColor,
      spacing: 4,
    });
    
    // Away team bar
    chartData.push({
      value: awayValue,
      frontColor: awayColor,
      spacing: index < TIME_PERIODS.length - 1 ? 20 : 0,
    });
  });
  
  return chartData;
};

export const GoalPowerChart: React.FC<GoalPowerChartProps> = ({
  data,
  homeColor = CHART_COLORS.homeTeam,
  awayColor = CHART_COLORS.awayTeam,
  isDark = true,
}) => {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    if (!data?.homeTeam?.goals?.for?.minute || !data?.awayTeam?.goals?.for?.minute) {
      return [];
    }
    return transformToChartData(
      data.homeTeam.goals.for.minute,
      data.awayTeam.goals.for.minute,
      homeColor,
      awayColor
    );
  }, [data, homeColor, awayColor]);

  // Calculate max value for Y-axis
  const yAxisMax = useMemo(() => {
    if (!data?.homeTeam?.goals?.for?.minute || !data?.awayTeam?.goals?.for?.minute) {
      return 5;
    }
    const allValues = [
      ...Object.values(data.homeTeam.goals.for.minute).map(v => v?.total ?? 0),
      ...Object.values(data.awayTeam.goals.for.minute).map(v => v?.total ?? 0),
    ];
    const maxValue = Math.max(...allValues, 1);
    return Math.ceil(maxValue) + 1;
  }, [data]);

  // X-axis labels
  const xLabels = ["5'", "15'", "30'", "45'", "60'", "75'", "90'", "105'"];

  // Safety check - don't render chart if data is not ready
  if (!data || !chartData || chartData.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={CHART_COLORS.homeTeam} />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={CHART_WIDTH}
        height={200}
        barWidth={12}
        spacing={4}
        initialSpacing={15}
        endSpacing={15}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        noOfSections={yAxisMax}
        maxValue={yAxisMax}
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisTextStyle={{ ...styles.yAxisLabel, color: isDark ? '#667085' : '#18223A' }}
        hideRules={false}
        rulesColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
        rulesType="solid"
        yAxisLabelWidth={25}
        yAxisColor="transparent"
        xAxisColor="transparent"
        disablePress
      />
      
      {/* Custom X-axis labels */}
      <View style={styles.xAxisContainer}>
        {xLabels.map((label, index) => (
          <Text key={index} style={[styles.xAxisLabel, { color: isDark ? '#667085' : '#18223A' }]}>
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: homeColor }]} />
          <Text style={[styles.legendText, { color: isDark ? '#FFFFFF' : '#18223A' }]}>{data.homeTeam.name}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: awayColor }]} />
          <Text style={[styles.legendText, { color: isDark ? '#FFFFFF' : '#18223A' }]}>{data.awayTeam.name}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginTop: 8,
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH - 25,
    marginTop: 8,
    marginLeft: 25,
  },
  yAxisLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
  },
  xAxisLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#FFFFFF',
  },
});

export default GoalPowerChart;

