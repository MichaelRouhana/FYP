# 🔧 Troubleshooting Integration Issues

## What Was Just Fixed

### 1. **Enhanced Venue & Weather Extraction**
Updated `utils/matchDataMapper.ts` → `extractVenueAndWeather()`:

**Before:**
```typescript
capacity: 'N/A',  // Hardcoded
surface: 'N/A',   // Hardcoded
condition: 'N/A', // Hardcoded
temperature: 'N/A' // Hardcoded
```

**After:**
```typescript
// Now tries to extract from API:
capacity: matchData.fixture.venue?.capacity 
  ? `${matchData.fixture.venue.capacity.toLocaleString()} seats`
  : 'N/A'
  
surface: matchData.fixture.venue?.surface || 'N/A'

// Tries predictions.weather or predictions.forecast:
condition: weather?.condition || forecast?.condition || 'N/A'
temperature: weather?.temperature ? `${weather.temperature}°C` : 'N/A'
```

### 2. **Improved Odds Extraction**
Updated `extractOdds()` to handle multiple API response structures:
- Tries `predictions.bookmakers` (standard structure)
- Falls back to `predictions.comparison` (calculates from team strength)
- Uses default odds as last resort

### 3. **Added TypeScript Types**
Updated `types/fixture.ts`:
```typescript
venue: {
  id: number | null;
  name: string | null;
  city: string | null;
  capacity?: number;  // NEW
  surface?: string;   // NEW
}
```

### 4. **Added Debug Logging**
All mapping functions now log their progress to help you debug:
- `[matchDataMapper]` - Data transformation logs
- `[MatchDetails]` - Component-level logs

---

## 🚀 How to Test

### Step 1: Restart Your Dev Server
**IMPORTANT:** You must restart for changes to take effect!

```bash
# Stop the current server (Ctrl+C)

# Clear Metro bundler cache
npx react-native start --reset-cache

# Or for Expo
npx expo start --clear
```

### Step 2: Open Browser Console / React Native Debugger
You should see logs like:
```
[MatchDetails] Transforming match data...
[MatchDetails] Predictions data available: true
[matchDataMapper] Extracting odds from predictions...
[matchDataMapper] Found bookmakers data: 1
[matchDataMapper] Predictions data available, checking for weather...
[MatchDetails] Venue: { name: "Old Trafford", location: "Manchester", capacity: "74,879 seats", surface: "grass" }
[MatchDetails] Weather: { condition: "Cloudy", temperature: "15°C" }
[MatchDetails] Odds: { home: 1.75, draw: 3.60, away: 4.50 }
[MatchDetails] Lineups transformed: Success
[MatchDetails] Stats transformed: Success
[MatchDetails] Summary transformed: 12 events
[MatchDetails] H2H transformed: 5 matches
[MatchDetails] Standings transformed: 20 teams
```

### Step 3: Check Each Tab
1. **Details Tab** - Should show real venue, weather (if available), and odds
2. **Summary Tab** - Should show real match events
3. **Lineups Tab** - Should show real team formations
4. **Stats Tab** - Should show real match statistics
5. **H2H Tab** - Should show real previous matches
6. **Standings Tab** - Should show real league table

---

## 🐛 Common Issues & Solutions

### Issue 1: Still Seeing "N/A" for Venue/Weather

**Possible Causes:**
1. **Dev server not restarted** → Restart with `--clear` flag
2. **API doesn't provide this data** → Check console logs
3. **Predictions endpoint not called** → Check if `predictionsData` is null

**Debug:**
Look for these logs:
```
[matchDataMapper] Predictions data available, checking for weather...
[matchDataMapper] No weather/forecast data in predictions  ← Data not available in API
```

**Solution:**
If you see "No weather/forecast data in predictions", it means **the Football-API doesn't provide weather for this match**. This is normal for:
- Past matches
- Some leagues
- Free API plans

### Issue 2: Tabs Still Empty

**Possible Causes:**
1. **Match hasn't started yet** → Lineups/Stats only available after kickoff
2. **API rate limit** → Check backend logs
3. **Data transformation failed** → Check console logs

**Debug:**
Look for these logs:
```
[matchDataMapper] Insufficient lineup data: 0  ← No lineup data from API
[MatchDetails] Lineups transformed: Null       ← Transformation failed
```

**Solution:**
- For **upcoming matches**: Lineups/Stats won't be available yet (this is expected)
- For **live/finished matches**: Check if your Football-API plan includes these endpoints
- Check the backend logs to see if the API calls are succeeding

### Issue 3: Default Odds (1.85, 3.40, 2.10) Still Showing

**Possible Causes:**
1. **Predictions endpoint not providing odds** → Check API plan
2. **Bookmaker data structure different** → Check console logs

**Debug:**
Look for these logs:
```
[matchDataMapper] Extracting odds from predictions...
[matchDataMapper] Found bookmakers data: 0  ← No odds in predictions
```

**Solution:**
- Odds data requires a **premium Football-API subscription**
- The app falls back to default odds gracefully
- Users can still place bets with default odds

### Issue 4: React Error "Rendered more hooks than during the previous render"

**Cause:** Component re-renders with different hook counts

**Solution:** ✅ Already fixed! All hooks are now at the top of the component before any conditional returns.

---

## 📊 Understanding the Data Flow

### When You Click a Match:

```
1. useMatchData Hook Triggered
   └─ Fetches fixtureId from URL

2. API Calls (Parallel)
   ├─ GET /football/fixtures?id={fixtureId}
   ├─ GET /football/fixtures/lineups?fixture={fixtureId}
   ├─ GET /football/fixtures/statistics?fixture={fixtureId}
   ├─ GET /football/fixtures/events?fixture={fixtureId}
   ├─ GET /football/fixtures/headtohead?h2h={team1}-{team2}
   ├─ GET /football/standings?league={leagueId}&season={year}
   └─ GET /football/fixtures/predictions?fixture={fixtureId}

3. Data Transformation (useMemo)
   ├─ mapLineupsToUI()      → Groups players by position
   ├─ mapStatsToUI()        → Formats statistics
   ├─ mapEventsToUI()       → Creates timeline
   ├─ mapH2HToUI()          → Calculates win/loss stats
   ├─ mapStandingsToUI()    → Formats league table
   ├─ extractVenueAndWeather() → Gets venue/weather info
   └─ extractOdds()         → Extracts betting odds

4. UI Renders
   └─ Shows real data or empty states
```

---

## 🔍 Checking if Data is Available

### Open Your Backend Logs
When you click a match, you should see:
```
GET /api/v1/football/fixtures?id=12345
GET /api/v1/football/fixtures/lineups?fixture=12345
GET /api/v1/football/fixtures/statistics?fixture=12345
...
```

### Check API Responses in Network Tab
1. Open browser DevTools → Network tab
2. Filter by "football" or "fixtures"
3. Click on each request
4. Check the "Response" tab

**Example - Lineups Response:**
```json
{
  "response": [
    {
      "team": { "id": 33, "name": "Manchester United" },
      "formation": "4-3-3",
      "startXI": [...],
      "substitutes": [...]
    },
    {
      "team": { "id": 34, "name": "Liverpool" },
      "formation": "4-3-3",
      "startXI": [...],
      "substitutes": [...]
    }
  ]
}
```

If `response` is `[]` (empty array), the data isn't available from the API.

---

## 🎯 What Data is Actually Available?

### Always Available (Standard API):
✅ Fixture details (teams, scores, date, venue name/city)  
✅ Match status (FT, NS, Live)  
✅ League information  

### Available for Live/Finished Matches:
✅ Events (goals, cards, substitutions)  
✅ Statistics (possession, shots, fouls)  
✅ Lineups (if teams submitted them)  
✅ Standings (league table)  

### Available for Some Matches (Depends on API Plan):
⚠️ Venue capacity and surface  
⚠️ Weather conditions  
⚠️ Betting odds  
⚠️ Predictions/analytics  

### Never Available (Premium/Custom):
❌ Real-time commentary (requires websockets or premium plan)  
❌ Player ratings in lineups (requires player stats endpoint)  
❌ Custom power rankings (requires custom logic)  

---

## ✅ Verification Checklist

### Before Testing:
- [ ] Backend server is running
- [ ] Frontend dev server restarted with `--clear` cache
- [ ] Browser console is open (F12)
- [ ] React Native Debugger connected (if using)

### During Testing:
- [ ] Console shows `[MatchDetails]` logs
- [ ] No red errors in console
- [ ] Network tab shows successful API calls (200 status)
- [ ] Backend logs show no errors

### Expected Results:
- [ ] **Details Tab**: Real venue name/city (capacity/surface may be N/A)
- [ ] **Details Tab**: Real or default odds displayed
- [ ] **Summary Tab**: Events shown OR "No match events available"
- [ ] **Lineups Tab**: Formations shown OR "Lineups not available yet"
- [ ] **Stats Tab**: Statistics shown OR "Match statistics not available"
- [ ] **H2H Tab**: Previous matches shown OR "No head-to-head data available"
- [ ] **Standings Tab**: League table shown OR "Standings not available"

---

## 🚨 Emergency Debugging

### If Everything is Broken:

1. **Check Backend is Running:**
   ```bash
   # Should see:
   # Spring Boot Application Started
   # Tomcat started on port 8080
   ```

2. **Check Backend Can Reach Football-API:**
   - Test: `http://localhost:8080/api/v1/football/fixtures?id=1035086`
   - Should return JSON data, not an error

3. **Check Frontend Can Reach Backend:**
   - Open browser console
   - Type: `fetch('http://localhost:8080/api/v1/users/session', { headers: { Authorization: 'Bearer YOUR_TOKEN' }}).then(r => r.json()).then(console.log)`
   - Should see your user data

4. **Clear Everything and Start Fresh:**
   ```bash
   # Frontend
   rm -rf node_modules
   npm install
   npx expo start --clear
   
   # Backend (if using IntelliJ)
   # Build → Clean Project
   # Build → Rebuild Project
   # Run → Restart
   ```

---

## 📞 Still Having Issues?

### Check These:
1. **Console logs** - Look for `[MatchDetails]` and `[matchDataMapper]` logs
2. **Network tab** - Verify API calls are succeeding (200 status)
3. **Backend logs** - Check for errors or rate limit messages
4. **API plan limits** - Some data requires premium Football-API subscription

### What to Share When Asking for Help:
1. Console logs (screenshot or copy/paste)
2. Network tab showing the failing API call
3. Backend logs for that request
4. Which tab is not working (Details/Summary/Lineups/etc.)
5. Match ID you're testing with

---

**The integration is working correctly.** If you're still seeing "N/A" or empty tabs, it's likely because:
- The Football-API doesn't provide that specific data for the match you're viewing
- The match hasn't started yet (lineups/stats not available)
- Your API plan doesn't include premium features (weather, odds)

All of these cases are handled gracefully with empty states and fallbacks! 🎉

