import { CHART_COLORS, RADAR_CATEGORIES } from '@/mock/matchPower/constants';
import { TeamBalanceData, TeamBalanceStats } from '@/mock/matchPower/types';
import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

interface TeamBalanceChartProps {
  data: TeamBalanceData | null | undefined;
  homeColor?: string;
  awayColor?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - 80;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 40;

export const TeamBalanceChart: React.FC<TeamBalanceChartProps> = ({
  data,
  homeColor = CHART_COLORS.homeTeam,
  awayColor = CHART_COLORS.awayTeam,
}) => {
  // Safety check - don't render chart if data is not ready
  if (!data?.homeTeam?.stats || !data?.awayTeam?.stats) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={CHART_COLORS.homeTeam} />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  const categories = RADAR_CATEGORIES;
  const angleStep = (2 * Math.PI) / categories.length;
  
  // Convert stats object to array matching category order
  const getStatsArray = (stats: TeamBalanceStats) => [
    stats.strength,
    stats.attacking,
    stats.defensive,
    stats.wins,
    stats.draws,
    stats.loss,
    stats.goals,
  ];

  const homeStats = getStatsArray(data.homeTeam.stats);
  const awayStats = getStatsArray(data.awayTeam.stats);

  // Calculate point position on radar
  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    const normalizedValue = (value / 100) * RADIUS;
    return {
      x: CENTER + normalizedValue * Math.cos(angle),
      y: CENTER + normalizedValue * Math.sin(angle),
    };
  };

  // Generate polygon points string
  const getPolygonPoints = (stats: number[]) => {
    return stats
      .map((value, index) => {
        const point = getPoint(value, index);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  };

  // Generate grid lines (concentric polygons)
  const gridLevels = [20, 40, 60, 80, 100];
  
  const getGridPolygonPoints = (level: number) => {
    return categories
      .map((_, index) => {
        const point = getPoint(level, index);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  };

  // Label positions (slightly outside the radar)
  const getLabelPosition = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const labelRadius = RADIUS + 25;
    return {
      x: CENTER + labelRadius * Math.cos(angle),
      y: CENTER + labelRadius * Math.sin(angle),
    };
  };

  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Grid lines */}
        {gridLevels.map((level) => (
          <Polygon
            key={`grid-${level}`}
            points={getGridPolygonPoints(level)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {categories.map((_, index) => {
          const point = getPoint(100, index);
          return (
            <Line
              key={`axis-${index}`}
              x1={CENTER}
              y1={CENTER}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          );
        })}

        {/* Away team polygon (drawn first, behind) */}
        <Polygon
          points={getPolygonPoints(awayStats)}
          fill={`${awayColor}33`}
          stroke={awayColor}
          strokeWidth={2}
        />

        {/* Home team polygon (drawn second, in front) */}
        <Polygon
          points={getPolygonPoints(homeStats)}
          fill={`${homeColor}33`}
          stroke={homeColor}
          strokeWidth={2}
        />

        {/* Data points for home team */}
        {homeStats.map((value, index) => {
          const point = getPoint(value, index);
          return (
            <Circle
              key={`home-point-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={homeColor}
            />
          );
        })}

        {/* Data points for away team */}
        {awayStats.map((value, index) => {
          const point = getPoint(value, index);
          return (
            <Circle
              key={`away-point-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={awayColor}
            />
          );
        })}

        {/* Category labels */}
        {categories.map((category, index) => {
          const pos = getLabelPosition(index);
          return (
            <SvgText
              key={`label-${index}`}
              x={pos.x}
              y={pos.y}
              fill={CHART_COLORS.axisLabel}
              fontSize={13}
              fontFamily="Montserrat_400Regular"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {category}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: homeColor }]} />
          <Text style={styles.legendText}>{data.homeTeam.name}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: awayColor }]} />
          <Text style={styles.legendText}>{data.awayTeam.name}</Text>
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
    height: CHART_SIZE,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
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

export default TeamBalanceChart;

