// Mock data for match lineups - structured for future API integration

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  rating: number;
  photo?: string; // Will be loaded from API later
}

export interface TeamLineup {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  formation: string;
  teamRating: number;
  starters: {
    goalkeeper: Player[];
    defenders: Player[];
    midfielders: Player[];
    forwards: Player[];
  };
  substitutes: Player[];
}

export interface MatchLineups {
  matchId: string;
  homeTeam: TeamLineup;
  awayTeam: TeamLineup;
}

// Mock lineup data based on the provided image
export const mockMatchLineups: MatchLineups = {
  matchId: 'match-1',
  homeTeam: {
    teamId: 'psg',
    teamName: 'PARIS-SAINT',
    formation: '4-3-3',
    teamRating: 1.0,
    starters: {
      goalkeeper: [
        { id: 'p1', name: 'Donnarumma', number: 1, position: 'GK', rating: 9.0 },
      ],
      defenders: [
        { id: 'p2', name: 'Hakimi', number: 2, position: 'RB', rating: 6.6 },
        { id: 'p3', name: 'Marquinhos', number: 4, position: 'CB', rating: 4.1 },
        { id: 'p4', name: 'Ramos', number: 5, position: 'CB', rating: 9.0 },
        { id: 'p5', name: 'Mendes', number: 3, position: 'LB', rating: 6.6 },
      ],
      midfielders: [
        { id: 'p6', name: 'Vitinha', number: 8, position: 'CM', rating: 6.6 },
        { id: 'p7', name: 'Verratti', number: 6, position: 'CM', rating: 9.0 },
        { id: 'p8', name: 'Ruiz', number: 10, position: 'CM', rating: 7.8 },
      ],
      forwards: [
        { id: 'p9', name: 'Dembele', number: 7, position: 'RW', rating: 6.6 },
        { id: 'p10', name: 'Mbappe', number: 9, position: 'ST', rating: 9.0 },
        { id: 'p11', name: 'Barcola', number: 11, position: 'LW', rating: 6.6 },
      ],
    },
    substitutes: [
      { id: 'ps1', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'ps2', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'ps3', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'ps4', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'ps5', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'ps6', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
    ],
  },
  awayTeam: {
    teamId: 'marseille',
    teamName: 'MARSEILLE',
    formation: '4-3-3',
    teamRating: 1.0,
    starters: {
      goalkeeper: [
        { id: 'a1', name: 'Pau Lopez', number: 1, position: 'GK', rating: 9.0 },
      ],
      defenders: [
        { id: 'a2', name: 'Clauss', number: 2, position: 'RB', rating: 6.6 },
        { id: 'a3', name: 'Balerdi', number: 4, position: 'CB', rating: 9.0 },
        { id: 'a4', name: 'Mbemba', number: 5, position: 'CB', rating: 6.6 },
        { id: 'a5', name: 'Tavares', number: 3, position: 'LB', rating: 6.6 },
      ],
      midfielders: [
        { id: 'a6', name: 'Rongier', number: 8, position: 'CM', rating: 6.6 },
        { id: 'a7', name: 'Veretout', number: 6, position: 'CM', rating: 4.1 },
        { id: 'a8', name: 'Guendouzi', number: 10, position: 'CM', rating: 9.0 },
      ],
      forwards: [
        { id: 'a9', name: 'Under', number: 7, position: 'RW', rating: 6.6 },
        { id: 'a10', name: 'Sanchez', number: 9, position: 'ST', rating: 9.0 },
        { id: 'a11', name: 'Aubameyang', number: 11, position: 'LW', rating: 6.6 },
      ],
    },
    substitutes: [
      { id: 'as1', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'as2', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'as3', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'as4', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'as5', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
      { id: 'as6', name: 'EVERSON', number: 1, position: 'GoalKeeper', rating: 7.0 },
    ],
  },
};

export const getMatchLineups = (matchId: string): MatchLineups => {
  return mockMatchLineups;
};

// Helper to get rating badge color based on common thresholds
export const getRatingColor = (rating: number): string => {
  if (rating >= 8.0) return '#22c55e'; // Green - excellent
  if (rating >= 7.0) return '#84cc16'; // Light green - very good
  if (rating >= 6.0) return '#eab308'; // Yellow - good
  if (rating >= 5.0) return '#f97316'; // Orange - average
  return '#ef4444'; // Red - poor
};
