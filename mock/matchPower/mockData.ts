import {
    GoalPowerData,
    GoalsByMinute,
    MatchPowerData,
    TeamBalanceData,
    TeamPowerData,
} from './types';

// ============================================
// TEAM BALANCE Mock Data (Radar Chart)
// Values are percentages (0-100)
// ============================================
const teamBalanceMockData: TeamBalanceData = {
  homeTeam: {
    name: 'PSG',
    stats: {
      strength: 85,
      attacking: 90,
      defensive: 75,
      wins: 80,
      draws: 45,
      loss: 30,
      goals: 88,
    },
  },
  awayTeam: {
    name: 'Marseille',
    stats: {
      strength: 70,
      attacking: 75,
      defensive: 80,
      wins: 65,
      draws: 50,
      loss: 40,
      goals: 70,
    },
  },
};

// ============================================
// TEAM POWER Mock Data (Line Chart)
// Power values over match time (0-100 scale)
// Updated to show more distinct patterns between teams
// ============================================
const teamPowerMockData: TeamPowerData = {
  homeTeam: {
    name: 'PSG',
    timeSeries: [
      { minute: 5, value: 42 },   // Starts lower
      { minute: 10, value: 48 },  // Gradual rise
      { minute: 15, value: 55 },  // Building momentum
      { minute: 20, value: 68 },  // Strong push
      { minute: 25, value: 75 },  // Peak performance
      { minute: 30, value: 72 },  // Slight dip
      { minute: 35, value: 78 },  // Strong again
      { minute: 40, value: 82 },  // Highest point
      { minute: 45, value: 76 },  // End of half
    ],
  },
  awayTeam: {
    name: 'Marseille',
    timeSeries: [
      { minute: 5, value: 58 },   // Starts stronger
      { minute: 10, value: 62 },  // Maintains
      { minute: 15, value: 58 },  // Slight drop
      { minute: 20, value: 52 },  // Losing ground
      { minute: 25, value: 48 },  // Low point
      { minute: 30, value: 55 },  // Recovery attempt
      { minute: 35, value: 60 },  // Building back
      { minute: 40, value: 58 },  // Stabilizing
      { minute: 45, value: 62 },  // End of half
    ],
  },
};

// ============================================
// GOAL POWER Mock Data (Bar Chart)
// Structure matches API-Football goals.for.minute
// Empty data - will show when game starts
// ============================================
const emptyGoalsByMinute: GoalsByMinute = {
  '0-15': { total: 0, percentage: '0%' },
  '16-30': { total: 0, percentage: '0%' },
  '31-45': { total: 0, percentage: '0%' },
  '46-60': { total: 0, percentage: '0%' },
  '61-75': { total: 0, percentage: '0%' },
  '76-90': { total: 0, percentage: '0%' },
  '91-105': { total: 0, percentage: '0%' },
  '106-120': { total: 0, percentage: '0%' },
};

const goalPowerMockData: GoalPowerData = {
  homeTeam: {
    name: 'PSG',
    goals: {
      for: {
        minute: emptyGoalsByMinute,
      },
    },
  },
  awayTeam: {
    name: 'Marseille',
    goals: {
      for: {
        minute: emptyGoalsByMinute,
      },
    },
  },
};

// ============================================
// Combined Match Power Data
// ============================================
export const getMatchPowerData = (matchId: string): MatchPowerData => {
  // In the future, this would fetch from an API based on matchId
  return {
    teamBalance: teamBalanceMockData,
    teamPower: teamPowerMockData,
    goalPower: goalPowerMockData,
  };
};

// Export individual data getters for flexibility
export const getTeamBalanceData = (matchId: string): TeamBalanceData => teamBalanceMockData;
export const getTeamPowerData = (matchId: string): TeamPowerData => teamPowerMockData;
export const getGoalPowerData = (matchId: string): GoalPowerData => goalPowerMockData;

