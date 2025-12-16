import { PlayerStats } from '@/types/player';

export const mockPlayerData: Record<string, PlayerStats> = {
  'player-1': {
    player: {
      id: 1,
      name: 'Everson',
      firstname: 'Everson',
      lastname: '',
      age: 35,
      birth: {
        date: '22/07/1990',
        place: 'Brazil',
        country: 'Brazil',
      },
      nationality: 'Brazilian',
      height: '192 cm',
      weight: '70 KG',
      photo: 'https://media.api-sports.io/football/players/1.png',
      position: 'Goalkeeper',
    },
    statistics: [
      {
        team: { id: 85, name: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
        league: { name: 'Ligue 1', season: 2024 },
        games: { appearences: 30, lineups: 30, minutes: 2831, rating: '7.17' },
        shots: { total: 0, on: 0 },
        goals: { total: 0, assists: 30, saves: 2831, conceded: 30 },
        passes: { total: 717, key: 0, accuracy: 85 },
        tackles: { total: 23, blocks: 0, interceptions: 0 },
        duels: { total: 717, won: 30 },
        dribbles: { attempts: 0, success: 0 },
        fouls: { drawn: 30, committed: 717 },
        cards: { yellow: 2, yellowred: 1, red: 0 },
        penalty: { won: 0, commited: 0, scored: 30, missed: 717, saved: 30 },
        substitutes: { in: 2, out: 4, bench: 19 },
      },
    ],
  },
  // Default player for testing
  'default': {
    player: {
      id: 999,
      name: 'Test Player',
      firstname: 'Test',
      lastname: 'Player',
      age: 25,
      birth: {
        date: '01/01/1999',
        place: 'Paris',
        country: 'France',
      },
      nationality: 'French',
      height: '180 cm',
      weight: '75 KG',
      photo: 'https://media.api-sports.io/football/players/999.png',
      position: 'Midfielder',
    },
    statistics: [
      {
        team: { id: 85, name: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
        league: { name: 'Ligue 1', season: 2024 },
        games: { appearences: 20, lineups: 18, minutes: 1500, rating: '7.50' },
        shots: { total: 30, on: 15 },
        goals: { total: 5, assists: 8, saves: 0, conceded: 0 },
        passes: { total: 500, key: 25, accuracy: 88 },
        tackles: { total: 40, blocks: 5, interceptions: 20 },
        duels: { total: 150, won: 80 },
        dribbles: { attempts: 50, success: 30 },
        fouls: { drawn: 15, committed: 10 },
        cards: { yellow: 3, yellowred: 0, red: 0 },
        penalty: { won: 1, commited: 0, scored: 2, missed: 0, saved: 0 },
        substitutes: { in: 5, out: 3, bench: 10 },
      },
    ],
  },
};

export const getPlayerData = (playerId: string): PlayerStats => {
  return mockPlayerData[playerId] || mockPlayerData['default'];
};

