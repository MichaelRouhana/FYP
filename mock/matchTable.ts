export interface TeamStanding {
  position: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueTable {
  leagueName: string;
  standings: TeamStanding[];
}

export const getMatchTable = (matchId: string): LeagueTable => {
  // Mock data based on the image provided
  return {
    leagueName: 'UEFA Champions League 25/26',
    standings: [
      { position: 1, teamName: 'PSG', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 13, goalsAgainst: 3, points: 9 },
      { position: 2, teamName: 'Bayern', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 12, goalsAgainst: 2, points: 9 },
      { position: 3, teamName: 'Inter', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 9, goalsAgainst: 0, points: 9 },
      { position: 4, teamName: 'Arsenal', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 8, goalsAgainst: 0, points: 9 },
      { position: 5, teamName: 'Real Madrid', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 8, goalsAgainst: 1, points: 9 },
      { position: 6, teamName: 'Dortmund', played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 12, goalsAgainst: 7, points: 7 },
      { position: 7, teamName: 'Man City', played: 3, won: 3, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, points: 7 },
      { position: 8, teamName: 'Newcastle', played: 3, won: 3, drawn: 0, lost: 1, goalsFor: 8, goalsAgainst: 2, points: 6 },
      { position: 9, teamName: 'Barcelona', played: 3, won: 3, drawn: 0, lost: 1, goalsFor: 9, goalsAgainst: 4, points: 6 },
      { position: 10, teamName: 'Liverpool', played: 3, won: 3, drawn: 0, lost: 1, goalsFor: 8, goalsAgainst: 4, points: 6 },
      { position: 11, teamName: 'Chelsea', played: 3, won: 3, drawn: 0, lost: 1, goalsFor: 7, goalsAgainst: 4, points: 6 },
      { position: 12, teamName: 'Marseille', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, points: 6 },
    ],
  };
};

