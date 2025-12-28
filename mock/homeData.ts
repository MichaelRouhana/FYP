// Mock data for home page - structured for future API integration

export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  time: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  betsCount: number;
  isFavorite: boolean;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: any; // require() returns any
  matches: Match[];
}

export interface DateOption {
  id: string;
  dayName: string;
  monthDay: string;
  isToday: boolean;
  date: Date;
  fullDate: string; // YYYY-MM-DD format for API calls
}

// Generate dates for the date navigation
export const generateDates = (): DateOption[] => {
  const dates: DateOption[] = [];
  const today = new Date();
  
  // Generate dates from -2 to +4 days from today
  for (let i = -2; i <= 4; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // FIX: Use Local Time parts to construct YYYY-MM-DD
    // This prevents timezone shifts (e.g. 11 PM becoming tomorrow in UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : i === -1 ? 'Yest' : days[date.getDay()];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${date.getDate()} ${months[date.getMonth()]}`;
    
    dates.push({
      id: i.toString(),
      dayName,
      monthDay: formattedDate,
      isToday: i === 0,
      date: date,
      fullDate: fullDate, // Correct local YYYY-MM-DD
    });
  }
  
  return dates;
};

// Mock teams
const teams: Record<string, Team> = {
  psg: { id: 'psg', name: 'PSG', logo: 'psg' },
  lorient: { id: 'lorient', name: 'Lorient', logo: 'lorient' },
  juventus: { id: 'juventus', name: 'Juventus', logo: 'juventus' },
  milan: { id: 'milan', name: 'AC Milan', logo: 'milan' },
  inter: { id: 'inter', name: 'Inter Milan', logo: 'inter' },
  roma: { id: 'roma', name: 'AS Roma', logo: 'roma' },
  napoli: { id: 'napoli', name: 'Napoli', logo: 'napoli' },
  lazio: { id: 'lazio', name: 'Lazio', logo: 'lazio' },
  barcelona: { id: 'barcelona', name: 'Barcelona', logo: 'barcelona' },
  realMadrid: { id: 'realMadrid', name: 'Real Madrid', logo: 'realMadrid' },
  atletico: { id: 'atletico', name: 'Atletico Madrid', logo: 'atletico' },
  sevilla: { id: 'sevilla', name: 'Sevilla', logo: 'sevilla' },
  bayern: { id: 'bayern', name: 'Bayern Munich', logo: 'bayern' },
  dortmund: { id: 'dortmund', name: 'Dortmund', logo: 'dortmund' },
  liverpool: { id: 'liverpool', name: 'Liverpool', logo: 'liverpool' },
  manCity: { id: 'manCity', name: 'Man City', logo: 'manCity' },
  chelsea: { id: 'chelsea', name: 'Chelsea', logo: 'chelsea' },
  arsenal: { id: 'arsenal', name: 'Arsenal', logo: 'arsenal' },
};

// Mock leagues with matches
export const mockLeagues: League[] = [
  {
    id: 'seria-1',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-1',
        homeTeam: teams.psg,
        awayTeam: teams.lorient,
        time: '02:00 PM',
        status: 'upcoming',
        betsCount: 450,
        isFavorite: false,
      },
      {
        id: 'match-2',
        homeTeam: teams.psg,
        awayTeam: teams.lorient,
        time: '02:00 PM',
        status: 'upcoming',
        betsCount: 30,
        isFavorite: false,
      },
      {
        id: 'match-3',
        homeTeam: teams.psg,
        awayTeam: teams.lorient,
        time: 'LIVE',
        status: 'live',
        homeScore: 1,
        awayScore: 0,
        betsCount: 30,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-2',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-4',
        homeTeam: teams.juventus,
        awayTeam: teams.milan,
        time: '04:00 PM',
        status: 'upcoming',
        betsCount: 85,
        isFavorite: false,
      },
      {
        id: 'match-5',
        homeTeam: teams.inter,
        awayTeam: teams.roma,
        time: '06:00 PM',
        status: 'upcoming',
        betsCount: 120,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-3',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-6',
        homeTeam: teams.napoli,
        awayTeam: teams.lazio,
        time: '08:00 PM',
        status: 'upcoming',
        betsCount: 65,
        isFavorite: false,
      },
      {
        id: 'match-7',
        homeTeam: teams.milan,
        awayTeam: teams.inter,
        time: 'LIVE',
        status: 'live',
        homeScore: 2,
        awayScore: 2,
        betsCount: 250,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-4',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-8',
        homeTeam: teams.roma,
        awayTeam: teams.napoli,
        time: '03:00 PM',
        status: 'upcoming',
        betsCount: 45,
        isFavorite: false,
      },
      {
        id: 'match-9',
        homeTeam: teams.lazio,
        awayTeam: teams.juventus,
        time: '05:00 PM',
        status: 'upcoming',
        betsCount: 78,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-5',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-10',
        homeTeam: teams.milan,
        awayTeam: teams.roma,
        time: '07:00 PM',
        status: 'upcoming',
        betsCount: 92,
        isFavorite: false,
      },
      {
        id: 'match-11',
        homeTeam: teams.inter,
        awayTeam: teams.napoli,
        time: '09:00 PM',
        status: 'upcoming',
        betsCount: 110,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-6',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-12',
        homeTeam: teams.juventus,
        awayTeam: teams.lazio,
        time: '01:00 PM',
        status: 'upcoming',
        betsCount: 55,
        isFavorite: false,
      },
      {
        id: 'match-13',
        homeTeam: teams.napoli,
        awayTeam: teams.milan,
        time: 'LIVE',
        status: 'live',
        homeScore: 0,
        awayScore: 1,
        betsCount: 180,
        isFavorite: false,
      },
    ],
  },
  {
    id: 'seria-7',
    name: 'SERIE A',
    country: 'Italy',
    logo: require('@/images/SerieA.jpg'),
    matches: [
      {
        id: 'match-14',
        homeTeam: teams.roma,
        awayTeam: teams.inter,
        time: '04:30 PM',
        status: 'upcoming',
        betsCount: 42,
        isFavorite: false,
      },
      {
        id: 'match-15',
        homeTeam: teams.lazio,
        awayTeam: teams.milan,
        time: '06:30 PM',
        status: 'upcoming',
        betsCount: 67,
        isFavorite: false,
      },
    ],
  },
];

// Helper function to filter leagues by match status
export const filterLeaguesByStatus = (
  leagues: League[],
  status: 'all' | 'live' | 'upcoming'
): League[] => {
  if (status === 'all') return leagues;
  
  return leagues
    .map((league) => ({
      ...league,
      matches: league.matches.filter((match) => match.status === status),
    }))
    .filter((league) => league.matches.length > 0);
};

