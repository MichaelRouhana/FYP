import { CHART_COLORS } from '@/mock/matchPower/constants';
import { TeamPowerData } from '@/mock/matchPower/types';
import React, { useMemo } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface TeamPowerChartProps {
  data: TeamPowerData | null | undefined;
  homeColor?: string;
  awayColor?: string;
  isDark?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

export const TeamPowerChart: React.FC<TeamPowerChartProps> = ({
  data,
  homeColor = CHART_COLORS.homeTeam,
  awayColor = CHART_COLORS.awayTeam,
  isDark = true,
}) => {
  const homeData = useMemo(() => {
    if (!data?.homeTeam?.timeSeries || data.homeTeam.timeSeries.length === 0) {
      return [];
    }
    return data.homeTeam.timeSeries.map((point) => ({
      value: point.value,
    }));
  }, [data]);

  const awayData = useMemo(() => {
    if (!data?.awayTeam?.timeSeries || data.awayTeam.timeSeries.length === 0) {
      return [];
    }
    return data.awayTeam.timeSeries.map((point) => ({
      value: point.value,
    }));
  }, [data]);

  // X-axis labels (separate from chart data to avoid duplicates)
  const xAxisLabels = useMemo(() => {
    if (!data?.homeTeam?.timeSeries || data.homeTeam.timeSeries.length === 0) {
      return [];
    }
    return data.homeTeam.timeSeries.map((point) => `${point.minute}'`);
  }, [data]);

  // Safety check - don't render chart if data is not ready
  if (!data || homeData.length === 0 || awayData.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={CHART_COLORS.homeTeam} />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  const spacing = homeData.length > 1 ? CHART_WIDTH / (homeData.length - 1) : CHART_WIDTH;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={[styles.axisLabel, { color: isDark ? '#667085' : '#18223A' }]}>HI</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.axisLabel, { color: isDark ? '#667085' : '#18223A' }]}>LO</Text>
        </View>

        <LineChart
          data={homeData}
          data2={awayData}
          width={CHART_WIDTH}
          height={150}
          spacing={spacing}
          initialSpacing={0}
          endSpacing={0}
          color={homeColor}
          color2={awayColor}
          thickness={3}
          thickness2={3}
          hideDataPoints
          hideDataPoints2
          curved={false}
          hideYAxisText
          backgroundColor="transparent"
          xAxisColor="transparent"
          yAxisColor="transparent"
          yAxisThickness={0}
          xAxisThickness={0}
          noOfSections={4}
          showVerticalLines
          verticalLinesColor={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
          verticalLinesThickness={1}
          hideRules
          disableScroll
        />
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxisContainer}>
        {xAxisLabels.map((label, index) => (
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
    height: 150,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginTop: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabels: {
    height: 150,
    justifyContent: 'space-between',
    marginRight: 8,
  },
  axisLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH,
    marginTop: 8,
    paddingHorizontal: 0,
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

export default TeamPowerChart;
