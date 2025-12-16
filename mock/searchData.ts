// Search Data Types and Mock Data
// Structured for easy API-Football integration later

export type ResultType = 'team' | 'player' | 'league';

export interface SearchResultItem {
  id: string | number;
  type: ResultType;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  isFavorite: boolean;
  originalData?: any;
}

// Mock data for search results
const mockSearchData: SearchResultItem[] = [
  // Leagues/Competitions
  {
    id: 'league-1',
    type: 'league',
    title: 'Serie A',
    subtitle: 'Italy',
    imageUrl: null, // Will use placeholder
    isFavorite: false,
  },
  {
    id: 'league-2',
    type: 'league',
    title: 'Premier League',
    subtitle: 'England',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'league-3',
    type: 'league',
    title: 'La Liga',
    subtitle: 'Spain',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'league-4',
    type: 'league',
    title: 'Bundesliga',
    subtitle: 'Germany',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'league-5',
    type: 'league',
    title: 'Ligue 1',
    subtitle: 'France',
    imageUrl: null,
    isFavorite: false,
  },
  // Players
  {
    id: 'player-1',
    type: 'player',
    title: 'Everson',
    subtitle: 'Goalkeeper',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'player-2',
    type: 'player',
    title: 'Kylian Mbappé',
    subtitle: 'Forward',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'player-3',
    type: 'player',
    title: 'Erling Haaland',
    subtitle: 'Forward',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'player-4',
    type: 'player',
    title: 'Jude Bellingham',
    subtitle: 'Midfielder',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'player-5',
    type: 'player',
    title: 'Vinicius Junior',
    subtitle: 'Forward',
    imageUrl: null,
    isFavorite: false,
  },
  // Teams
  {
    id: 'team-1',
    type: 'team',
    title: 'Paris Saint Germain',
    subtitle: 'Ligue 1',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'team-2',
    type: 'team',
    title: 'Manchester City',
    subtitle: 'Premier League',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'team-3',
    type: 'team',
    title: 'Real Madrid',
    subtitle: 'La Liga',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'team-4',
    type: 'team',
    title: 'Bayern Munich',
    subtitle: 'Bundesliga',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'team-5',
    type: 'team',
    title: 'Inter Milan',
    subtitle: 'Serie A',
    imageUrl: null,
    isFavorite: false,
  },
  {
    id: 'team-6',
    type: 'team',
    title: 'Marseille',
    subtitle: 'Ligue 1',
    imageUrl: null,
    isFavorite: false,
  },
];

export type FilterType = 'all' | 'teams' | 'players' | 'competition';

/**
 * Search hook that filters mock data based on query and filter type
 * This will be replaced with real API calls later
 */
export const searchData = (
  query: string,
  filter: FilterType
): SearchResultItem[] => {
  let results = [...mockSearchData];

  // Filter by type
  if (filter === 'teams') {
    results = results.filter((item) => item.type === 'team');
  } else if (filter === 'players') {
    results = results.filter((item) => item.type === 'player');
  } else if (filter === 'competition') {
    results = results.filter((item) => item.type === 'league');
  }

  // Filter by search query
  if (query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle.toLowerCase().includes(lowerQuery)
    );
  }

  return results;
};

/**
 * Get all data without filtering (for initial state)
 */
export const getAllSearchData = (): SearchResultItem[] => {
  return [...mockSearchData];
};

