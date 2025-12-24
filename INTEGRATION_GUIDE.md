# Backend Integration Guide - Home Screen

## Overview
The Home screen has been successfully integrated with the backend API, replacing mock data with real fixture data from `/fixtures/public`.

## What Was Changed

### 1. New Type Definitions (`types/fixture.ts`)
Created comprehensive TypeScript types for:
- **FixtureViewDTO**: Backend response structure
- **FootballApiFixture**: The rawJson field structure (Football-API standard format)
- **UIMatch & UILeague**: Transformed types for UI rendering

### 2. Home Screen Integration (`app/(tabs)/home.tsx`)

#### API Call
```typescript
const response = await api.get<FixtureViewDTO[]>('/fixtures/public');
```

#### Data Transformation
The `transformFixturesToLeagues()` function converts backend data to UI format:
- Extracts team names, logos from `rawJson.teams`
- Extracts league info from `rawJson.league`
- Determines match status from `rawJson.fixture.status.short`:
  - **Live**: `1H`, `2H`, `HT`, `ET`, `P`, `LIVE`, `BT`
  - **Finished**: `FT`, `AET`, `PEN`
  - **Upcoming**: `NS`, `TBD`, etc.
- Formats time display based on status
- Groups matches by league

#### Key Features Implemented

1. **Loading State**
   - Shows `ActivityIndicator` while fetching data
   - Displays "Loading matches..." message

2. **Empty State**
   - Shows soccer icon and message when no matches available

3. **Live Status Detection**
   - Automatically detects live matches from API status codes
   - Shows "LIVE" badge and elapsed time

4. **HOT Indicator** 🔥
   - Displays fire icon for matches with `bets >= 100`
   - Uses yellow highlight in dark mode, yellow background in light mode

5. **Team Logos**
   - Loads real team logos from `rawJson.teams.home.logo` and `rawJson.teams.away.logo`
   - Fallback to placeholder if logo unavailable

6. **League Logos**
   - Loads real league logos from `rawJson.league.logo`
   - Fallback to placeholder if unavailable

7. **Scores**
   - Shows scores for live and finished matches
   - Hidden for upcoming matches

## Data Flow

```
Backend API (/fixtures/public)
    ↓
FixtureViewDTO[] (with rawJson field)
    ↓
transformFixturesToLeagues()
    ↓
UILeague[] (grouped by league)
    ↓
UI Rendering
```

## rawJson Structure (Football-API)

The `rawJson` field contains the standard Football-API response:

```json
{
  "fixture": {
    "id": 12345,
    "date": "2024-12-24T15:00:00+00:00",
    "status": {
      "short": "NS",  // NS, 1H, 2H, HT, FT, etc.
      "long": "Not Started",
      "elapsed": null
    }
  },
  "league": {
    "id": 39,
    "name": "Premier League",
    "country": "England",
    "logo": "https://..."
  },
  "teams": {
    "home": {
      "id": 33,
      "name": "Manchester United",
      "logo": "https://..."
    },
    "away": {
      "id": 34,
      "name": "Liverpool",
      "logo": "https://..."
    }
  },
  "goals": {
    "home": 2,
    "away": 1
  }
}
```

## Status Codes Reference

### Live Match Statuses
- `1H` - First Half
- `2H` - Second Half
- `HT` - Half Time
- `ET` - Extra Time
- `P` - Penalty
- `LIVE` - Live
- `BT` - Break Time

### Finished Match Statuses
- `FT` - Full Time
- `AET` - After Extra Time
- `PEN` - Penalties

### Upcoming Match Statuses
- `NS` - Not Started
- `TBD` - To Be Determined
- `PST` - Postponed
- `CANC` - Cancelled

## Filter Functionality

The screen supports three filters:
- **ALL**: Shows all matches
- **LIVE**: Shows only live matches
- **UPCOMING**: Shows only upcoming matches

Filters work on the transformed data, not the API level.

## Next Steps

To complete the integration:
1. ✅ Home screen - DONE
2. Match details screen (`/match/[id]`)
3. Search functionality
4. Leaderboards
5. Bidding system

## Testing

To test the integration:
1. Ensure backend is running on the IP configured in `services/api.ts`
2. Make sure you have fixtures in the database (use admin panel or sync service)
3. Ensure fixtures have `showMatch: true` and `allowBetting: true` in matchSettings
4. Open the app and navigate to the Home tab

## Troubleshooting

**No matches showing?**
- Check if backend has fixtures with `showMatch: true`
- Verify API endpoint is `/fixtures/public` not `/fixtures/all`
- Check network logs in React Native debugger

**Images not loading?**
- Verify team/league logos are valid URLs in the rawJson
- Check CORS settings if testing on web
- Ensure device has internet connection

**Status not updating?**
- Backend needs to sync fixtures regularly
- Status comes from `rawJson.fixture.status.short`
- Consider implementing polling or WebSocket for live updates

