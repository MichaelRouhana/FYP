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
// ============================================
const teamPowerMockData: TeamPowerData = {
  homeTeam: {
    name: 'PSG',
    timeSeries: [
      { minute: 5, value: 45 },
      { minute: 10, value: 52 },
      { minute: 15, value: 48 },
      { minute: 20, value: 65 },
      { minute: 25, value: 58 },
      { minute: 30, value: 72 },
      { minute: 35, value: 68 },
      { minute: 40, value: 75 },
      { minute: 45, value: 70 },
    ],
  },
  awayTeam: {
    name: 'Marseille',
    timeSeries: [
      { minute: 5, value: 55 },
      { minute: 10, value: 60 },
      { minute: 15, value: 58 },
      { minute: 20, value: 52 },
      { minute: 25, value: 68 },
      { minute: 30, value: 62 },
      { minute: 35, value: 70 },
      { minute: 40, value: 65 },
      { minute: 45, value: 72 },
    ],
  },
};

// ============================================
// GOAL POWER Mock Data (Bar Chart)
// Structure matches API-Football goals.for.minute
// ============================================
const psgGoalsByMinute: GoalsByMinute = {
  '0-15': { total: 3, percentage: '12%' },
  '16-30': { total: 4, percentage: '16%' },
  '31-45': { total: 2, percentage: '8%' },
  '46-60': { total: 5, percentage: '20%' },
  '61-75': { total: 4, percentage: '16%' },
  '76-90': { total: 5, percentage: '20%' },
  '91-105': { total: 1, percentage: '4%' },
  '106-120': { total: 1, percentage: '4%' },
};

const marseilleGoalsByMinute: GoalsByMinute = {
  '0-15': { total: 2, percentage: '10%' },
  '16-30': { total: 3, percentage: '15%' },
  '31-45': { total: 2, percentage: '10%' },
  '46-60': { total: 4, percentage: '20%' },
  '61-75': { total: 3, percentage: '15%' },
  '76-90': { total: 4, percentage: '20%' },
  '91-105': { total: 1, percentage: '5%' },
  '106-120': { total: 1, percentage: '5%' },
};

const goalPowerMockData: GoalPowerData = {
  homeTeam: {
    name: 'PSG',
    goals: {
      for: {
        minute: psgGoalsByMinute,
      },
    },
  },
  awayTeam: {
    name: 'Marseille',
    goals: {
      for: {
        minute: marseilleGoalsByMinute,
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

