// Mock data for H2H (Head to Head) - structured for future API integration

export interface H2HMatch {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time?: string; // For upcoming matches
  isCompleted: boolean;
}

export interface H2HStats {
  homeWins: number;
  draws: number;
  awayWins: number;
}

export interface H2HData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  stats: H2HStats;
  matches: H2HMatch[];
}

// Mock H2H data based on the provided image
export const mockH2HData: H2HData = {
  matchId: 'match-1',
  homeTeam: 'PSG',
  awayTeam: 'Marseille',
  stats: {
    homeWins: 16,
    draws: 5,
    awayWins: 3,
  },
  matches: [
    {
      id: 'h2h-1',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 1,
      awayScore: 0,
      isCompleted: true,
    },
    {
      id: 'h2h-2',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      time: '6:00 PM',
      isCompleted: false,
    },
    {
      id: 'h2h-3',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      time: '6:00 PM',
      isCompleted: false,
    },
    {
      id: 'h2h-4',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      time: '6:00 PM',
      isCompleted: false,
    },
    {
      id: 'h2h-5',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      time: '6:00 PM',
      isCompleted: false,
    },
    {
      id: 'h2h-6',
      date: 'May 3, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      time: '6:00 PM',
      isCompleted: false,
    },
    // Additional matches for "See All"
    {
      id: 'h2h-7',
      date: 'Apr 15, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 2,
      awayScore: 1,
      isCompleted: true,
    },
    {
      id: 'h2h-8',
      date: 'Mar 20, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 3,
      awayScore: 0,
      isCompleted: true,
    },
    {
      id: 'h2h-9',
      date: 'Feb 10, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 1,
      awayScore: 1,
      isCompleted: true,
    },
    {
      id: 'h2h-10',
      date: 'Jan 5, 2026',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 2,
      awayScore: 2,
      isCompleted: true,
    },
  ],
};

export const getH2HData = (matchId: string): H2HData => {
  return mockH2HData;
};

