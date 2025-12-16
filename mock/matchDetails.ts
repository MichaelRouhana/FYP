// Mock data for match details - structured for future API integration

export interface MatchDetails {
  id: string;
  league: string;
  date: string;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  homeScore: number;
  awayScore: number;
  matchTime: string; // "37:04" for live, "FT" for finished, "" for upcoming
  status: 'upcoming' | 'live' | 'finished';
  isFavorite: boolean;
  venue: {
    name: string;
    location: string;
    capacity: string;
    surface: string;
  };
  weather: {
    condition: string;
    temperature: string;
  };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

// Mock match details data
export const mockMatchDetails: Record<string, MatchDetails> = {
  'match-1': {
    id: 'match-1',
    league: 'Serie A',
    date: 'Fri, November 14, 2025',
    homeTeam: {
      name: 'PSG',
      logo: 'psg',
    },
    awayTeam: {
      name: 'Marseille',
      logo: 'marseille',
    },
    homeScore: 1,
    awayScore: 0,
    matchTime: '37:04',
    status: 'live',
    isFavorite: false,
    venue: {
      name: 'Stade du Moustoir - Yves Allainmat',
      location: 'Lorient, France',
      capacity: '18,970',
      surface: 'Artificiel',
    },
    weather: {
      condition: 'Partly Cloudy',
      temperature: '52°',
    },
    odds: {
      home: 2.1,
      draw: 3.2,
      away: 2.8,
    },
  },
  'match-2': {
    id: 'match-2',
    league: 'Serie A',
    date: 'Fri, November 14, 2025',
    homeTeam: {
      name: 'PSG',
      logo: 'psg',
    },
    awayTeam: {
      name: 'Lorient',
      logo: 'lorient',
    },
    homeScore: 0,
    awayScore: 0,
    matchTime: '',
    status: 'upcoming',
    isFavorite: true,
    venue: {
      name: 'Parc des Princes',
      location: 'Paris, France',
      capacity: '47,929',
      surface: 'Natural Grass',
    },
    weather: {
      condition: 'Sunny',
      temperature: '68°',
    },
    odds: {
      home: 1.5,
      draw: 4.0,
      away: 5.5,
    },
  },
  'match-3': {
    id: 'match-3',
    league: 'Serie A',
    date: 'Fri, November 14, 2025',
    homeTeam: {
      name: 'PSG',
      logo: 'psg',
    },
    awayTeam: {
      name: 'Lorient',
      logo: 'lorient',
    },
    homeScore: 1,
    awayScore: 0,
    matchTime: 'LIVE',
    status: 'live',
    isFavorite: false,
    venue: {
      name: 'Stade du Moustoir',
      location: 'Lorient, France',
      capacity: '18,970',
      surface: 'Natural Grass',
    },
    weather: {
      condition: 'Rainy',
      temperature: '45°',
    },
    odds: {
      home: 1.8,
      draw: 3.5,
      away: 4.2,
    },
  },
};

// Default match for unknown IDs
export const defaultMatchDetails: MatchDetails = {
  id: 'default',
  league: 'Serie A',
  date: 'Fri, November 14, 2025',
  homeTeam: {
    name: 'PSG',
    logo: 'psg',
  },
  awayTeam: {
    name: 'Marseille',
    logo: 'marseille',
  },
  homeScore: 1,
  awayScore: 0,
  matchTime: '37:04',
  status: 'live',
  isFavorite: false,
  venue: {
    name: 'Stade du Moustoir - Yves Allainmat',
    location: 'Lorient, France',
    capacity: '18,970',
    surface: 'Artificiel',
  },
  weather: {
    condition: 'Partly Cloudy',
    temperature: '52°',
  },
  odds: {
    home: 2.1,
    draw: 3.2,
    away: 2.8,
  },
};

export const getMatchDetails = (id: string): MatchDetails => {
  return mockMatchDetails[id] || defaultMatchDetails;
};

