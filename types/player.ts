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
    shots: { total: number | null; on: number | null };
    goals: { total: number; assists: number; saves: number | null; conceded: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number; yellowred: number; red: number };
    penalty: { won: number | null; commited: number | null; scored: number; missed: number; saved: number };
    substitutes: { in: number; out: number; bench: number };
  }[];
}

