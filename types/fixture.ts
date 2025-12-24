// Backend API Response Types

export interface FixtureViewDTO {
  id: number;
  rawJson: FootballApiFixture;
  bets: number;
  matchPredictionSettings: MatchPredictionSettings;
  matchSettings: MatchSettings;
}

export interface MatchPredictionSettings {
  goalsOverUnder: boolean;
  bothTeamsScore: boolean;
  firstTeamToScore: boolean;
  doubleChance: boolean;
  scorePrediction: boolean;
  whoWillWin: boolean;
}

export interface MatchSettings {
  allowBettingHT: boolean;
  showMatch: boolean;
  allowBetting: boolean;
}

// Football-API Standard Response (rawJson structure)
export interface FootballApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO 8601
    timestamp: number;
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
      capacity?: number;
      surface?: string;
    };
    status: {
      long: string; // "Match Finished", "Not Started", "First Half", etc.
      short: string; // "FT", "NS", "1H", "HT", "2H", "LIVE"
      elapsed: number | null; // minutes elapsed
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

// UI Types (transformed from backend)
export interface UIMatch {
  id: number;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  time: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  betsCount: number;
  date: string;
  leagueId: number;
  leagueName: string;
}

export interface UILeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  matches: UIMatch[];
}

// Football-API Lineup Response Types
export interface FootballApiLineupPlayer {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string; // Position: G, D, M, F
    grid: string | null; // e.g., "1:1" or null
    photo?: string;
  };
  statistics?: Array<{
    games: {
      rating: string | null; // e.g., "7.2" or null
      minutes: number;
      substitute: boolean;
    };
  }>;
}

export interface FootballApiPredictions {
  predictions?: {
    winner?: {
      id: number;
      name: string;
      comment: string;
    };
    advice?: string; // e.g., "Team1 to win", may contain weather info
    percent?: {
      home: string;
      draw: string;
      away: string;
    };
  };
  forecast?: {
    condition?: string; // Weather condition
    temperature?: number;
  };
  weather?: {
    condition?: string;
    temperature?: number;
    description?: string;
  };
  bookmakers?: Array<any>;
}

