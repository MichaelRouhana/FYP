// Mock data for match stats - structured for future API integration

export interface StatItem {
  name: string;
  homeValue: number;
  awayValue: number;
}

export interface MatchStats {
  matchId: string;
  possession: {
    home: number;
    away: number;
  };
  topStats: StatItem[];
  shots: StatItem[];
}

// Mock stats data based on the provided image
export const mockMatchStats: MatchStats = {
  matchId: 'match-1',
  possession: {
    home: 78,
    away: 22,
  },
  topStats: [
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
    { name: 'Shots Inside Box', homeValue: 7, awayValue: 2 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 7 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
  ],
  shots: [
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
    { name: 'Shots Inside Box', homeValue: 7, awayValue: 2 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 7 },
    { name: 'Blocked shots', homeValue: 7, awayValue: 2 },
  ],
};

export const getMatchStats = (matchId: string): MatchStats => {
  return mockMatchStats;
};

