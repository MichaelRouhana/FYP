# Backend Integration Summary

## ✅ Completed Work

### Backend Changes
1. **Added Points to User Session** (`JwtResponseDTO.java`)
   - Added `points` field to JWT response
   - Updated `/users/session` endpoint to return user points

2. **Fixed Signup Auto-Verification**
   - Users are auto-verified on signup (development mode)
   - Email verification is optional (wrapped in try-catch)

### Frontend Type Definitions
3. **Created Complete Type System**
   - `types/fixture.ts` - Fixture and Football-API types
   - `types/bet.ts` - Betting system types (MarketType, BetStatus, etc.)
   - All backend DTOs properly typed

### API Service Layer
4. **Match API Service** (`services/matchApi.ts`)
   - `getFixtureDetails()` - Main fixture data
   - `getFixtureLineups()` - Team lineups
   - `getFixtureStatistics()` - Match statistics
   - `getFixtureEvents()` - Goals, cards, substitutions
   - `getHeadToHead()` - H2H history
   - `getStandings()` - League table
   - `getPredictions()` - Match predictions/power data

5. **Betting API Service** (`services/betApi.ts`)
   - `placeBet()` - Submit new bet
   - `getAllBets()` - Get user's bet history
   - `getUserSession()` - Get user data with points
   - `createMatchWinnerBet()` - Helper function

6. **Home Screen Integration** (`app/(tabs)/home.tsx`)
   - Fully integrated with `/fixtures/public`
   - Real-time team logos and scores
   - HOT indicator for popular matches (100+ bets)
   - Loading states and empty states
   - League grouping from Football-API data

### Documentation
7. **Comprehensive Documentation**
   - `INTEGRATION_GUIDE.md` - Home screen integration details
   - `API_INTEGRATION_PLAN.md` - Complete integration strategy
   - `INTEGRATION_SUMMARY.md` - This document

## 🔄 Next Steps

### High Priority: Match Detail Screen

The match detail screen (`app/match/[id].tsx`) is **2,500+ lines** with 9 tabs. Here's the systematic approach:

#### Step 1: Create Match Data Hook
Create `hooks/useMatchData.ts`:

```typescript
import { useState, useEffect } from 'react';
import { 
  getFixtureDetails, 
  getFixtureLineups, 
  getFixtureStatistics,
  getFixtureEvents,
  getHeadToHead,
  getStandings,
  getPredictions
} from '@/services/matchApi';

export const useMatchData = (fixtureId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [lineups, setLineups] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  // ... other states

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fixture = await getFixtureDetails(fixtureId);
        setMatchData(fixture);
        
        // Fetch other data based on fixture
        const [lineupsData, statsData, eventsData] = await Promise.all([
          getFixtureLineups(fixtureId),
          getFixtureStatistics(fixtureId),
          getFixtureEvents(fixtureId)
        ]);
        
        setLineups(lineupsData);
        setStats(statsData);
        // ... set other data
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fixtureId]);

  return { loading, error, matchData, lineups, stats, ... };
};
```

#### Step 2: Update Match Detail Screen Header
In `app/match/[id].tsx`, replace mock data in the header section:

```typescript
// BEFORE:
const match = getMatchDetails(id || 'default');

// AFTER:
const { loading, matchData, lineups, stats, error } = useMatchData(id || '');

if (loading) {
  return <ActivityIndicator />;
}

if (error) {
  return <ErrorScreen message={error} />;
}
```

#### Step 3: Update Each Tab Progressively
1. **Details Tab** - Uses `matchData` (venue, weather, odds)
2. **Predictions Tab** - Uses `predictions` from API
3. **Summary Tab** - Uses `events` data
4. **Lineups Tab** - Uses `lineups` data
5. **Stats Tab** - Uses `stats` data
6. **H2H Tab** - Uses `h2h` data
7. **Table Tab** - Uses `standings` data
8. **Power Tab** - Uses `predictions` API data
9. **Commentary Tab** - Generate from `events` or use separate API

#### Step 4: Integrate Betting in Details Tab
Update the "PLACE BID" button:

```typescript
import { placeBet, createMatchWinnerBet } from '@/services/betApi';

const handlePlaceBet = async () => {
  if (!betSelection || !stake) {
    Alert.alert('Error', 'Please select an option and enter stake');
    return;
  }

  try {
    setSubmitting(true);
    const betRequest = createMatchWinnerBet(
      Number(id),
      betSelection.toUpperCase() as 'HOME' | 'DRAW' | 'AWAY'
    );
    
    await placeBet(betRequest);
    
    Alert.alert('Success', 'Bet placed successfully!');
    // Refresh user balance
    await fetchUserSession();
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to place bet';
    Alert.alert('Error', message);
  } finally {
    setSubmitting(false);
  }
};
```

### High Priority: Bidding Screen

Update `app/(tabs)/bidding.tsx`:

#### Step 1: Replace useBidding Hook
Create `hooks/useBettingHistory.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getAllBets } from '@/services/betApi';
import { FixtureViewDTO } from '@/types/fixture';
import api from '@/services/api';

export const useBettingHistory = () => {
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState([]);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const betsResponse = await getAllBets();
        
        // Fetch fixture details for each bet
        const betsWithFixtures = await Promise.all(
          betsResponse.content.map(async (bet) => {
            try {
              // Get fixture from backend to get team info
              const fixtureResponse = await api.get<FixtureViewDTO[]>(`/fixtures/public`);
              const fixture = fixtureResponse.data.find(f => f.id === bet.fixtureId);
              
              return {
                id: bet.id,
                matchId: String(bet.fixtureId),
                homeTeam: fixture?.rawJson.teams.home.name || 'Unknown',
                awayTeam: fixture?.rawJson.teams.away.name || 'Unknown',
                homeTeamLogo: fixture?.rawJson.teams.home.logo || '',
                awayTeamLogo: fixture?.rawJson.teams.away.logo || '',
                homeScore: fixture?.rawJson.goals.home,
                awayScore: fixture?.rawJson.goals.away,
                matchTime: fixture ? new Date(fixture.rawJson.fixture.date).toLocaleTimeString() : '',
                points: bet.stake,
                status: bet.status.toLowerCase(),
                selection: bet.selection,
              };
            } catch {
              return null;
            }
          })
        );
        
        setBets(betsWithFixtures.filter(b => b !== null));
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  return { loading, bets };
};
```

#### Step 2: Add User Balance Display
Add a header section showing points:

```typescript
const [userSession, setUserSession] = useState<UserSession | null>(null);

useEffect(() => {
  getUserSession().then(setUserSession);
}, []);

// In JSX, add below header:
{userSession && (
  <View style={styles.balanceCard}>
    <Text style={styles.balanceLabel}>Available Points</Text>
    <Text style={styles.balanceAmount}>{userSession.points} PTS</Text>
  </View>
)}
```

## 📝 Key Implementation Notes

### 1. MarketType Mapping
```typescript
// UI → API
'home' → 'HOME' (MATCH_WINNER)
'draw' → 'DRAW' (MATCH_WINNER)
'away' → 'AWAY' (MATCH_WINNER)
```

### 2. Error Handling Pattern
```typescript
try {
  const data = await apiCall();
  // Success
} catch (error: any) {
  const message = error.response?.data?.message 
    || error.message 
    || 'An error occurred';
  Alert.alert('Error', message);
}
```

### 3. Loading States
Always show ActivityIndicator while fetching:
```typescript
{loading ? (
  <ActivityIndicator size="large" color={theme.colors.primary} />
) : (
  <RenderContent />
)}
```

### 4. Football-API Response Structure
All forwarder endpoints return:
```typescript
{
  get: string;
  parameters: {...};
  errors: [];
  results: number;
  paging: {...};
  response: T[];  // ← Actual data here
}
```
Always use `response[0]` for single results or map over `response` for arrays.

## 🐛 Known Issues & Considerations

1. **No Stake in BetRequestDTO**: Backend doesn't accept stake amount. Bets might be free or fixed-stake.
   - Consider asking backend team about this
   - For now, just show potential winnings as informational

2. **Venue Details**: Football-API might not include capacity/surface for all venues
   - Provide fallback values or hide these fields if missing

3. **Live Updates**: Currently no real-time updates
   - Consider polling every 30s for live matches
   - Or implement WebSocket connection

4. **Bet History Performance**: Fetching fixture details for each bet is expensive
   - Consider backend endpoint that returns bets with fixture info
   - Or implement caching layer

5. **Rate Limiting**: Football-API has rate limits
   - Implement request caching
   - Show cached data while fetching fresh data

## 🎯 Testing Checklist

### Before Testing
- [ ] Backend is running on configured IP
- [ ] User is logged in (has JWT token)
- [ ] Database has fixtures synced
- [ ] Fixtures have `allowBetting: true`

### Home Screen ✅
- [x] Fixtures load correctly
- [x] Team logos display
- [x] HOT indicator for 100+ bets
- [x] League grouping works
- [x] Live status detection
- [x] Navigation to match details

### Match Details (To Test)
- [ ] Match data loads
- [ ] All tabs work
- [ ] Can place bet
- [ ] Bet success/error shown
- [ ] Odds display correctly

### Bidding Screen (To Test)
- [ ] Bet history loads
- [ ] Filters work
- [ ] User balance displays
- [ ] Navigation to matches works
- [ ] Status icons correct

## 🚀 Deployment Notes

### Environment Variables
Ensure `services/api.ts` has correct:
- `IP_ADDRESS`: Your backend server IP
- `PORT`: Backend server port (usually 8080)

### Backend Requirements
- Spring Boot app running
- MySQL database with fixtures
- Fixtures synced using admin panel
- Match settings: `allowBetting: true`, `showMatch: true`

### First-Time Setup
1. Start backend server
2. Login/Signup a test user
3. Sync fixtures (admin panel or API)
4. Set user points: `POST /users/setPoints?points=1000`
5. Test placing bets

## 📚 Additional Resources

- **Football-API Docs**: https://www.api-football.com/documentation-v3
- **Backend Source**: `fyp-backend/Fyp/src/main/java/com/example/FYP/Api/`
- **Types Reference**: `fyp-football-ui/types/`
- **API Services**: `fyp-football-ui/services/`

## 💡 Next Session Recommendations

1. **Create useMatchData hook** (30 minutes)
2. **Update match detail header** with real data (20 minutes)
3. **Test betting integration** on one tab (30 minutes)
4. **Create useBettingHistory hook** (20 minutes)
5. **Update bidding screen** (30 minutes)
6. **End-to-end testing** (30 minutes)

Total estimated time: **3 hours** for complete integration

---

**Status**: Foundation complete ✅  
**Next**: Implement hooks and refactor screens  
**Blockers**: None - all APIs are ready

