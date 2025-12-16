// Type definitions for Match Power data
// Structured to match API-Football response format

// ============================================
// TEAM BALANCE (Radar Chart) Types
// ============================================
export interface TeamBalanceStats {
  strength: number;
  attacking: number;
  defensive: number;
  wins: number;
  draws: number;
  loss: number;
  goals: number;
}

export interface TeamBalanceData {
  homeTeam: {
    name: string;
    stats: TeamBalanceStats;
  };
  awayTeam: {
    name: string;
    stats: TeamBalanceStats;
  };
}

// ============================================
// TEAM POWER (Line Chart) Types
// ============================================
export interface TimeSeriesPoint {
  minute: number;
  value: number;
}

export interface TeamPowerData {
  homeTeam: {
    name: string;
    timeSeries: TimeSeriesPoint[];
  };
  awayTeam: {
    name: string;
    timeSeries: TimeSeriesPoint[];
  };
}

// ============================================
// GOAL POWER (Bar Chart) Types
// Matches API-Football goals.for.minute structure
// ============================================
export interface MinuteStats {
  total: number | null;
  percentage: string | null;
}

export interface GoalsByMinute {
  '0-15': MinuteStats;
  '16-30': MinuteStats;
  '31-45': MinuteStats;
  '46-60': MinuteStats;
  '61-75': MinuteStats;
  '76-90': MinuteStats;
  '91-105': MinuteStats;
  '106-120': MinuteStats;
}

export interface GoalPowerData {
  homeTeam: {
    name: string;
    goals: {
      for: {
        minute: GoalsByMinute;
      };
    };
  };
  awayTeam: {
    name: string;
    goals: {
      for: {
        minute: GoalsByMinute;
      };
    };
  };
}

// ============================================
// Combined Match Power Data
// ============================================
export interface MatchPowerData {
  teamBalance: TeamBalanceData;
  teamPower: TeamPowerData;
  goalPower: GoalPowerData;
}

