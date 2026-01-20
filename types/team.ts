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
  };
  defending: {
    goalsConceded: number;
    cleanSheets: number;
  };
  other: {
    yellowCards: number;
    redCards: number;
  };
}

