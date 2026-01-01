/**
 * Odds Data Mapper
 * Maps API-Football v3 odds response into structured market data
 */

export interface BetType {
  id: number;
  name: string;
}

export interface OddsValue {
  value: string;
  odd: string;
}

export interface Bet {
  id: number;
  name: string;
  values: OddsValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: Bet[];
}

export interface OddsResponse {
  fixture: {
    id: number;
  };
  bookmakers: Bookmaker[];
}

export interface MarketSelection {
  value: string;
  odd: number;
  line?: string | number;
}

export interface Market {
  marketKey: string;
  marketName: string;
  betId: number;
  selections: MarketSelection[];
  isTable?: boolean; // If true, render as table (O/U, Handicap)
  tableLines?: Array<{
    line: string | number;
    selections: MarketSelection[];
  }>;
}

/**
 * Resolve bet type ID by searching for bet types
 */
export const resolveBetTypeId = (
  searchQuery: string,
  betTypes: BetType[]
): number | null => {
  if (!betTypes || betTypes.length === 0) {
    return null;
  }

  if (!searchQuery) {
    return null;
  }

  const searchQueryLower = searchQuery.toLowerCase();

  // First try exact match
  const exactMatch = betTypes.find((bt) => {
    if (!bt || !bt.name) return false;
    return bt.name.toLowerCase() === searchQueryLower;
  });
  if (exactMatch) return exactMatch.id;

  // Then try partial match
  const partialMatch = betTypes.find((bt) => {
    if (!bt || !bt.name) return false;
    return bt.name.toLowerCase().includes(searchQueryLower);
  });
  if (partialMatch) return partialMatch.id;

  // Try reverse (search query contains bet type name)
  const reverseMatch = betTypes.find((bt) => {
    if (!bt || !bt.name) return false;
    return searchQueryLower.includes(bt.name.toLowerCase());
  });
  if (reverseMatch) return reverseMatch.id;

  console.warn(`[oddsMapper] Could not find bet type for search: "${searchQuery}"`);
  if (betTypes.length > 0) {
    const validBetTypes = betTypes.filter((bt) => bt && bt.name).slice(0, 10);
    if (validBetTypes.length > 0) {
      console.log('[oddsMapper] Available bet types:', validBetTypes.map((bt) => `${bt.id}: ${bt.name}`));
    }
  }
  return null;
};

/**
 * Extract market data from odds response
 */
export const extractMarket = (
  oddsData: OddsResponse[],
  betId: number,
  marketKey: string,
  marketName: string
): Market | null => {
  if (!oddsData || oddsData.length === 0) return null;

  // Find the bet in any bookmaker
  let foundBet: Bet | null = null;
  for (const oddsItem of oddsData) {
    for (const bookmaker of oddsItem.bookmakers || []) {
      const bet = bookmaker.bets?.find((b) => b.id === betId);
      if (bet) {
        foundBet = bet;
        break;
      }
    }
    if (foundBet) break;
  }

  if (!foundBet || !foundBet.values || foundBet.values.length === 0) {
    return null;
  }

  // Map values to selections
  const selections: MarketSelection[] = foundBet.values.map((v) => ({
    value: v.value,
    odd: parseFloat(v.odd) || 0,
  }));

  return {
    marketKey,
    marketName,
    betId,
    selections,
  };
};

/**
 * Extract Over/Under market with multiple lines
 */
export const extractOverUnderMarket = (
  oddsData: OddsResponse[],
  betId: number,
  marketKey: string,
  marketName: string
): Market | null => {
  if (!oddsData || oddsData.length === 0) return null;

  // Find the bet
  let foundBet: Bet | null = null;
  for (const oddsItem of oddsData) {
    for (const bookmaker of oddsItem.bookmakers || []) {
      const bet = bookmaker.bets?.find((b) => b.id === betId);
      if (bet) {
        foundBet = bet;
        break;
      }
    }
    if (foundBet) break;
  }

  if (!foundBet || !foundBet.values || foundBet.values.length === 0) {
    return null;
  }

  // Group by line (e.g., "Over 2.5" -> line: 2.5, selection: "Over")
  const lineMap = new Map<string, MarketSelection[]>();

  foundBet.values.forEach((v) => {
    // Parse value like "Over 2.5" or "Under 1.5"
    const match = v.value.match(/(Over|Under)\s+([\d.]+)/i);
    if (match) {
      const selection = match[1].toUpperCase();
      const line = match[2];
      const key = line;

      if (!lineMap.has(key)) {
        lineMap.set(key, []);
      }

      lineMap.get(key)!.push({
        value: selection,
        odd: parseFloat(v.odd) || 0,
        line: parseFloat(line),
      });
    }
  });

  // Convert to table lines
  const tableLines = Array.from(lineMap.entries())
    .map(([line, selections]) => ({
      line: parseFloat(line),
      selections: selections.sort((a, b) => (a.value === 'OVER' ? -1 : 1)),
    }))
    .sort((a, b) => (a.line as number) - (b.line as number));

  if (tableLines.length === 0) return null;

  return {
    marketKey,
    marketName,
    betId,
    selections: [],
    isTable: true,
    tableLines,
  };
};

/**
 * Extract Handicap market with multiple lines
 */
export const extractHandicapMarket = (
  oddsData: OddsResponse[],
  betId: number,
  marketKey: string,
  marketName: string
): Market | null => {
  if (!oddsData || oddsData.length === 0) return null;

  // Find the bet
  let foundBet: Bet | null = null;
  for (const oddsItem of oddsData) {
    for (const bookmaker of oddsItem.bookmakers || []) {
      const bet = bookmaker.bets?.find((b) => b.id === betId);
      if (bet) {
        foundBet = bet;
        break;
      }
    }
    if (foundBet) break;
  }

  if (!foundBet || !foundBet.values || foundBet.values.length === 0) {
    return null;
  }

  // Group by handicap line
  const lineMap = new Map<string, MarketSelection[]>();

  foundBet.values.forEach((v) => {
    // Parse value like "Home -1", "Draw -1", "Away +1", etc.
    // Or it might be structured differently
    const parts = v.value.split(/\s+/);
    let line = '';
    let selection = '';

    if (parts.length >= 2) {
      // Try to extract line from value
      const lineMatch = v.value.match(/([+-]?\d+)/);
      if (lineMatch) {
        line = lineMatch[1];
        // Determine selection (Home/Draw/Away)
        if (v.value.toLowerCase().includes('home')) {
          selection = 'HOME';
        } else if (v.value.toLowerCase().includes('draw')) {
          selection = 'DRAW';
        } else if (v.value.toLowerCase().includes('away')) {
          selection = 'AWAY';
        }
      }
    }

    if (line && selection) {
      if (!lineMap.has(line)) {
        lineMap.set(line, []);
      }
      lineMap.get(line)!.push({
        value: selection,
        odd: parseFloat(v.odd) || 0,
        line,
      });
    }
  });

  // Convert to table lines
  const tableLines = Array.from(lineMap.entries())
    .map(([line, selections]) => ({
      line,
      selections: selections.sort((a, b) => {
        const order = ['HOME', 'DRAW', 'AWAY'];
        return order.indexOf(a.value) - order.indexOf(b.value);
      }),
    }))
    .sort((a, b) => {
      // Sort by numeric value of line
      const aNum = parseFloat(a.line as string) || 0;
      const bNum = parseFloat(b.line as string) || 0;
      return aNum - bNum;
    });

  if (tableLines.length === 0) return null;

  return {
    marketKey,
    marketName,
    betId,
    selections: [],
    isTable: true,
    tableLines,
  };
};

/**
 * Extract Team Total Over/Under market
 */
export const extractTeamTotalMarket = (
  oddsData: OddsResponse[],
  betId: number,
  marketKey: string,
  marketName: string,
  teamType: 'home' | 'away'
): Market | null => {
  if (!oddsData || oddsData.length === 0) return null;

  // Find the bet
  let foundBet: Bet | null = null;
  for (const oddsItem of oddsData) {
    for (const bookmaker of oddsItem.bookmakers || []) {
      const bet = bookmaker.bets?.find((b) => b.id === betId);
      if (bet) {
        foundBet = bet;
        break;
      }
    }
    if (foundBet) break;
  }

  if (!foundBet || !foundBet.values || foundBet.values.length === 0) {
    return null;
  }

  // Filter values that match team type (Home/Away)
  const teamValues = foundBet.values.filter((v) => {
    const valueLower = v.value.toLowerCase();
    const teamMatch = teamType === 'home' ? valueLower.includes('home') : valueLower.includes('away');
    return teamMatch && (valueLower.includes('over') || valueLower.includes('under'));
  });

  if (teamValues.length === 0) return null;

  // Group by line
  const lineMap = new Map<string, MarketSelection[]>();

  teamValues.forEach((v) => {
    const match = v.value.match(/(Over|Under)\s+([\d.]+)/i);
    if (match) {
      const selection = match[1].toUpperCase();
      const line = match[2];
      const key = line;

      if (!lineMap.has(key)) {
        lineMap.set(key, []);
      }

      lineMap.get(key)!.push({
        value: selection,
        odd: parseFloat(v.odd) || 0,
        line: parseFloat(line),
      });
    }
  });

  const tableLines = Array.from(lineMap.entries())
    .map(([line, selections]) => ({
      line: parseFloat(line),
      selections: selections.sort((a, b) => (a.value === 'OVER' ? -1 : 1)),
    }))
    .sort((a, b) => (a.line as number) - (b.line as number));

  if (tableLines.length === 0) return null;

  return {
    marketKey,
    marketName,
    betId,
    selections: [],
    isTable: true,
    tableLines,
  };
};

/**
 * Derive "Goals in Both Halves" from First Half and Second Half O/U 0.5
 */
export const deriveGoalsInBothHalves = (
  firstHalfOU: Market | null,
  secondHalfOU: Market | null
): Market | null => {
  if (!firstHalfOU || !secondHalfOU) return null;

  // Find O/U 0.5 for both halves
  const firstHalf05 = firstHalfOU.tableLines?.find((tl) => tl.line === 0.5);
  const secondHalf05 = secondHalfOU.tableLines?.find((tl) => tl.line === 0.5);

  if (!firstHalf05 || !secondHalf05) return null;

  const firstHalfOver = firstHalf05.selections.find((s) => s.value === 'OVER');
  const secondHalfOver = secondHalf05.selections.find((s) => s.value === 'OVER');

  if (!firstHalfOver || !secondHalfOver) return null;

  // Calculate implied probabilities
  const p1 = Math.max(0.01, Math.min(0.99, 1 / firstHalfOver.odd));
  const p2 = Math.max(0.01, Math.min(0.99, 1 / secondHalfOver.odd));

  // Probability both halves have goals
  const pYes = p1 * p2;
  const pNo = 1 - pYes;

  // Convert back to odds
  const oddsYes = pYes > 0 ? 1 / Math.max(0.01, pYes) : 0;
  const oddsNo = pNo > 0 ? 1 / Math.max(0.01, pNo) : 0;

  return {
    marketKey: 'goals_both_halves',
    marketName: 'Goals in Both Halves',
    betId: 0, // Not a real bet ID
    selections: [
      { value: 'YES', odd: oddsYes },
      { value: 'NO', odd: oddsNo },
    ],
    isTable: false,
  };
};

