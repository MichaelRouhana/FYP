// Mock data for match summary - structured for future API integration

export type EventType = 
  | 'goal'
  | 'own_goal'
  | 'yellow_card'
  | 'red_card'
  | 'two_yellow_card'
  | 'substitution'
  | 'penalty_scored'
  | 'penalty_missed'
  | 'canceled_goal';

export type TeamSide = 'home' | 'away';

export interface MatchEvent {
  id: string;
  type: EventType;
  time: string;
  team: TeamSide;
  playerName: string;
  playerOut?: string; // For substitutions
  score?: string; // Current score after goal (e.g., "0-1", "1-2")
}

export interface MatchSummary {
  matchId: string;
  halftimeScore: string;
  fulltimeScore: string;
  events: MatchEvent[];
}

// Mock summary data based on the provided image
export const mockMatchSummary: MatchSummary = {
  matchId: 'match-1',
  halftimeScore: '0-2',
  fulltimeScore: '2-2',
  events: [
    // First half events (chronological order)
    {
      id: 'e1',
      type: 'goal',
      time: "20'",
      team: 'away',
      playerName: 'EVERSON',
      score: '0-1',
    },
    {
      id: 'e2',
      type: 'goal',
      time: "41'",
      team: 'away',
      playerName: 'J. MERIO',
      score: '0-2',
    },
    {
      id: 'e3',
      type: 'yellow_card',
      time: "45+1'",
      team: 'home',
      playerName: 'J. SABORIDO',
    },
    // Second half events
    {
      id: 'e4',
      type: 'red_card',
      time: "46'",
      team: 'away',
      playerName: 'M. RODRIGUEZ',
    },
    {
      id: 'e5',
      type: 'substitution',
      time: "53'",
      team: 'away',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e6',
      type: 'substitution',
      time: "63'",
      team: 'home',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e7',
      type: 'substitution',
      time: "70'",
      team: 'home',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e8',
      type: 'substitution',
      time: "75'",
      team: 'away',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e9',
      type: 'goal',
      time: "75'",
      team: 'home',
      playerName: 'J. SABORIDO',
      score: '1-2',
    },
    {
      id: 'e10',
      type: 'yellow_card',
      time: "83'",
      team: 'home',
      playerName: 'J. SABORIDO',
    },
    {
      id: 'e11',
      type: 'goal',
      time: "83'",
      team: 'away',
      playerName: 'J. MERIO',
      score: '0-2',
    },
    {
      id: 'e12',
      type: 'substitution',
      time: "86'",
      team: 'away',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e13',
      type: 'substitution',
      time: "88'",
      team: 'away',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
    {
      id: 'e14',
      type: 'goal',
      time: "89'",
      team: 'home',
      playerName: 'J. SABORIDO',
      score: '2-2',
    },
    {
      id: 'e15',
      type: 'substitution',
      time: "90+1'",
      team: 'away',
      playerName: 'Everson',
      playerOut: 'J. Lucero',
    },
  ],
};

export const getMatchSummary = (matchId: string): MatchSummary => {
  return mockMatchSummary;
};

// Legend items for the summary
export const eventLegend: { type: EventType; label: string }[] = [
  { type: 'canceled_goal', label: 'Canceled Goal' },
  { type: 'goal', label: 'Goal' },
  { type: 'own_goal', label: 'Own Goal' },
  { type: 'penalty_scored', label: 'Penalty Successful' },
  { type: 'penalty_missed', label: 'Penalty Failed' },
  { type: 'two_yellow_card', label: '2 Yellow Card' },
  { type: 'red_card', label: 'Red Card' },
  { type: 'yellow_card', label: 'Yellow Card' },
  { type: 'substitution', label: 'Substitution' },
];

