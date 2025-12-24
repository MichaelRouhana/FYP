# API Integration Plan - Match Details & Bidding

## Backend Endpoints Reference

### Football Data (via forwarder)
- **Fixture Details**: `GET /football/fixtures?id={fixtureId}`
- **Lineups**: `GET /football/fixtures/lineups?fixture={fixtureId}`
- **Statistics**: `GET /football/fixtures/statistics?fixture={fixtureId}`
- **Events/Summary**: `GET /football/fixtures/events?fixture={fixtureId}`
- **Head-to-Head**: `GET /football/fixtures/headtohead?h2h={team1Id}-{team2Id}`
- **Standings**: `GET /football/standings?league={leagueId}&season={year}`
- **Predictions**: `GET /football/fixtures/predictions?fixture={fixtureId}`

### Betting Endpoints
- **Place Bet**: `POST /bets` (Body: {fixtureId, marketType, selection})
- **Get All Bets**: `GET /bets` (Returns PagedResponse<BetViewAllDTO>)
- **User Session**: `GET /users/session` (Returns {username, email, pfp, roles, points})

## MarketType Enum Values
```typescript
MATCH_WINNER          // Selection: "HOME", "DRAW", "AWAY"
BOTH_TEAMS_TO_SCORE   // Selection: "YES", "NO"
GOALS_OVER_UNDER      // Selection: "OVER 2.5", "UNDER 2.5"
FIRST_TEAM_TO_SCORE   // Selection: "HOME", "AWAY"
DOUBLE_CHANCE         // Selection: "HOME_OR_DRAW", "AWAY_OR_DRAW", "HOME_OR_AWAY"
SCORE_PREDICTION      // Selection: "2-1", "1-0", etc.
```

## Implementation Status

### ✅ Completed
1. Backend - Added `points` field to JwtResponseDTO
2. Backend - Updated `/users/session` endpoint to include points
3. Frontend - Created TypeScript types for bets and fixtures
4. Frontend - Home screen integrated with `/fixtures/public`

### 🔄 In Progress
5. Match Detail Screen API Integration

### ⏳ Pending
6. Bidding Screen API Integration
7. User Balance Integration
8. Loading States & Error Handling

## Match Detail Screen Integration

### Current Structure
- **File**: `app/match/[id].tsx`
- **Size**: ~2500 lines
- **Tabs**: Details, Predictions, Summary, Lineups, Stats, H2H, Table, Power, Commentary
- **Mock Data Sources**: 9 different mock files

### Integration Strategy

#### Phase 1: Core Match Data
1. Replace `getMatchDetails()` with API call to `/football/fixtures?id={id}`
2. Extract team IDs for subsequent calls
3. Map Football-API response to existing UI structure

#### Phase 2: Tab-Specific Data
4. **Summary Tab**: `/football/fixtures/events?fixture={id}`
5. **Lineups Tab**: `/football/fixtures/lineups?fixture={id}`
6. **Stats Tab**: `/football/fixtures/statistics?fixture={id}`
7. **H2H Tab**: `/football/fixtures/headtohead?h2h={homeId}-{awayId}`
8. **Table Tab**: `/football/standings?league={leagueId}&season={season}`
9. **Power/Predictions Tab**: `/football/fixtures/predictions?fixture={id}`
10. **Commentary Tab**: Use events API or create commentary from events

#### Phase 3: Betting Integration
11. Connect "PLACE BID" button to `POST /bets`
12. Map UI selections to proper MarketType
13. Handle bet response and errors

## Bidding Screen Integration

### Current Structure
- **File**: `app/(tabs)/bidding.tsx`
- **Hook**: `useBidding()` (returns mock data)
- **Filters**: All, Pending, Results

### Integration Strategy

#### Phase 1: Fetch Bets
1. Replace `useBidding` hook with API call to `GET /bets`
2. Transform `PagedResponse<BetViewAllDTO>` to UI format
3. Fetch fixture details for each bet to get team names/logos

#### Phase 2: User Balance
4. Fetch user session on mount: `GET /users/session`
5. Display points balance in UI
6. Update balance after placing bets

#### Phase 3: Filtering
7. Implement client-side filtering by status
8. Add pagination support if needed

## Data Mapping Examples

### Match Details (Football-API → UI)
```typescript
const mapFixtureToMatch = (apiData: FootballApiFixture) => ({
  id: apiData.fixture.id,
  homeTeam: {
    id: apiData.teams.home.id,
    name: apiData.teams.home.name,
    logo: apiData.teams.home.logo
  },
  awayTeam: {
    id: apiData.teams.away.id,
    name: apiData.teams.away.name,
    logo: apiData.teams.away.logo
  },
  homeScore: apiData.goals.home,
  awayScore: apiData.goals.away,
  status: apiData.fixture.status.short,
  venue: {
    name: apiData.fixture.venue.name,
    location: apiData.fixture.venue.city,
    // capacity & surface might not be in API
  },
  // ... map other fields
});
```

### Bet Request (UI → API)
```typescript
const createBetRequest = (
  fixtureId: number,
  selection: 'home' | 'draw' | 'away'
): BetRequestDTO => ({
  fixtureId,
  marketType: MarketType.MATCH_WINNER,
  selection: selection.toUpperCase() as MatchWinnerSelection
});
```

### Bet History (API → UI)
```typescript
const mapBetToUI = async (
  bet: BetViewAllDTO, 
  fixture: FixtureViewDTO
): Promise<UIBet> => ({
  id: bet.id,
  matchId: String(fixture.id),
  homeTeam: fixture.rawJson.teams.home.name,
  awayTeam: fixture.rawJson.teams.away.name,
  homeTeamLogo: fixture.rawJson.teams.home.logo,
  awayTeamLogo: fixture.rawJson.teams.away.logo,
  homeScore: fixture.rawJson.goals.home,
  awayScore: fixture.rawJson.goals.away,
  matchTime: new Date(fixture.rawJson.fixture.date).toLocaleTimeString(),
  points: bet.stake,
  status: bet.status.toLowerCase() as 'pending' | 'won' | 'lost',
  selection: bet.selection,
  marketType: bet.marketType
});
```

## Error Handling

### Common Error Scenarios
1. **Fixture not found** (404) - Show "Match not available" message
2. **Betting not allowed** (400) - Show "Betting is closed for this match"
3. **Insufficient points** (400) - Show "Insufficient balance" alert
4. **Network error** - Show retry button
5. **Unauthorized** (401) - Redirect to login

### Loading States
- Show `ActivityIndicator` while fetching match data
- Show skeleton loaders for each tab
- Disable betting button while submitting
- Show loading overlay for bet placement

## Testing Checklist

### Match Details
- [ ] Match data loads correctly
- [ ] All tabs display real data
- [ ] Team logos display correctly
- [ ] Scores update properly
- [ ] Venue information shows
- [ ] Tab switching works smoothly

### Betting
- [ ] Can place bet on match
- [ ] Selection updates potential winnings
- [ ] Bet submission shows success/error
- [ ] User balance updates after bet
- [ ] Betting disabled for closed matches

### Bidding Screen
- [ ] Bets list loads correctly
- [ ] Filters work (All/Pending/Results)
- [ ] Match navigation works
- [ ] Status icons display correctly
- [ ] Points show correct values

## Notes & Considerations

1. **No Stake in BetRequestDTO**: The backend doesn't accept stake in the request. Bets might be free or fixed-stake. Check with backend team.

2. **Football-API Rate Limits**: The forwarder endpoints hit external API. Implement caching if needed.

3. **Real-time Updates**: Consider WebSocket for live match updates instead of polling.

4. **Pagination**: Implement pagination for betting history if user has many bets.

5. **Offline Support**: Consider caching recent matches for offline viewing.

6. **Match Status Codes**: Different Football-APIs might use different status codes. Verify the exact codes used.

