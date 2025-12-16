// Color constants for Match Power charts
// These should be consistent across all charts

export const CHART_COLORS = {
  homeTeam: '#3FAC66',    // Green - PSG
  awayTeam: '#6773B0',    // Purple/Blue - Marseille
  background: '#080C17',  // Main background
  cardBackground: '#111828',
  gridLine: 'rgba(255, 255, 255, 0.1)',
  axisLabel: '#667085',
  separator: 'rgba(255, 255, 255, 0.3)',
  text: '#FFFFFF',
  textMuted: '#667085',
};

export const RADAR_CATEGORIES = [
  'Strength',
  'Attacking',
  'Defensive',
  'Wins',
  'Draws',
  'Loss',
  'Goals',
] as const;

export const TIME_PERIODS = [
  '0-15',
  '16-30',
  '31-45',
  '46-60',
  '61-75',
  '76-90',
  '91-105',
  '106-120',
] as const;

// X-axis labels for Goal Power chart (shortened for display)
export const GOAL_POWER_LABELS = [
  "0'",
  "15'",
  "30'",
  "45'",
  "60'",
  "75'",
  "90'",
  "105'",
];

