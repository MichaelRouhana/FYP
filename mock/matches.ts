import { Match } from '@/components/MatchCard';

export const matches: Match[] = [
  {
    id: 1,
    homeTeam: 'FC Barcelona',
    awayTeam: 'Real Madrid',
    homeScore: 2,
    awayScore: 1,
    startTime: new Date().toISOString(),
    status: 'live',
    tournament: 'La Liga',
    durationMinutes: 90,
    homeLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png',
    awayLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/120px-Real_Madrid_CF.svg.png',
    leagueLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/LaLiga.svg/120px-LaLiga.svg.png',
    events: [
      { minute: 12, type: 'goal', team: 'home', player: 'Lewandowski' },
      { minute: 36, type: 'yellow', team: 'away', player: 'Rüdiger' },
      { minute: 54, type: 'goal', team: 'away', player: 'Bellingham' },
      { minute: 67, type: 'yellow', team: 'home', player: 'Araujo' },
      { minute: 72, type: 'goal', team: 'home', player: 'Yamal' },
    ],
  },
  {
    id: 2,
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    startTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    status: 'upcoming',
    tournament: 'Premier League',
    durationMinutes: 90,
    homeLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png',
    awayLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png',
    leagueLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/120px-Premier_League_Logo.svg.png',
  },
  {
    id: 3,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    homeScore: 0,
    awayScore: 0,
    startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'finished',
    tournament: 'Bundesliga',
    durationMinutes: 90,
    homeLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/120px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png',
    awayLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/120px-Borussia_Dortmund_logo.svg.png',
    leagueLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Bundesliga_logo_%282017%29.svg/120px-Bundesliga_logo_%282017%29.svg.png',
  },
];


