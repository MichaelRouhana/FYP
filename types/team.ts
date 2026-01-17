/**
 * Team Statistics Types matching the backend DTO structure
 */

export interface StatGroup {
  [key: string]: number | string;
}

export interface TeamStats {
  summary: {
    played: number;
    wins: number;
    draws: number;
    loses: number;
    form: string;
  };
  attacking: {
    goalsScored: number;
    penaltiesScored: number;
    penaltiesMissed: number;
    shotsOnGoal: number;
    shotsOffGoal: number;
    totalShots?: number;
  };
  passing: {
    totalPasses?: number;
    passesAccurate?: number;
    passAccuracyPercentage?: number | string;
  };
  defending: {
    goalsConceded: number;
    cleanSheets: number;
    saves?: number;
    tackles?: number;
    interceptions?: number;
  };
  other: {
    yellowCards: number;
    redCards: number;
    fouls?: number;
    corners?: number;
    offsides?: number;
  };
}

