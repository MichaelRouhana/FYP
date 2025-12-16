// This matches the standard API-Football 'statistics' object structure
export interface PlayerStats {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
      date: string;
      place: string;
      country: string;
    };
    nationality: string;
    height: string;
    weight: string;
    photo: string;
    position: string;
  };
  statistics: {
    team: { id: number; name: string; logo: string };
    league: { name: string; season: number };
    games: { appearences: number; lineups: number; minutes: number; rating: string };
    shots: { total: number; on: number };
    goals: { total: number; assists: number; saves: number; conceded: number };
    passes: { total: number; key: number; accuracy: number };
    tackles: { total: number; blocks: number; interceptions: number };
    duels: { total: number; won: number };
    dribbles: { attempts: number; success: number };
    fouls: { drawn: number; committed: number };
    cards: { yellow: number; yellowred: number; red: number };
    penalty: { won: number; commited: number; scored: number; missed: number; saved: number };
    substitutes: { in: number; out: number; bench: number };
  }[];
}

