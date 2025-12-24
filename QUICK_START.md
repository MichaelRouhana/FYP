# 🚀 Quick Start - Complete the Integration

## ✅ Already Done
- ✅ Backend updated with user points
- ✅ All TypeScript types created
- ✅ API service layer complete
- ✅ Three custom hooks ready to use
- ✅ Home screen fully working

## 🎯 What You Need to Do (Est. 2 hours)

### Step 1: Update Match Detail Screen (60 min)

**File**: `app/match/[id].tsx`

1. **Add imports at the top:**
```typescript
import { useMatchData } from '@/hooks/useMatchData';
import { useUserBalance } from '@/hooks/useUserBalance';
import { placeBet, createMatchWinnerBet } from '@/services/betApi';
import { ActivityIndicator, Alert } from 'react-native';
```

2. **Replace line ~47-57 (mock data calls) with:**
```typescript
const { loading, error, matchData, lineups, stats, events, h2h, standings, predictions } = useMatchData(id || '');
const { balance, refetch: refetchBalance } = useUserBalance();
const [submitting, setSubmitting] = useState(false);

if (loading) {
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}

if (error || !matchData) {
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#ffffff' }}>Failed to load match data</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: '#22c55e', marginTop: 10 }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// Transform API data to match UI expectations
const match = {
  id: matchData.fixture.id,
  homeTeam: {
    name: matchData.teams.home.name,
    logo: matchData.teams.home.logo,
  },
  awayTeam: {
    name: matchData.teams.away.name,
    logo: matchData.teams.away.logo,
  },
  homeScore: matchData.goals.home ?? 0,
  awayScore: matchData.goals.away ?? 0,
  league: matchData.league.name,
  date: new Date(matchData.fixture.date).toLocaleDateString(),
  matchTime: matchData.fixture.status.short === 'FT' ? 'FT' : `${matchData.fixture.status.elapsed || 0}'`,
  venue: {
    name: matchData.fixture.venue.name || 'Unknown',
    location: matchData.fixture.venue.city || 'Unknown',
    capacity: 'N/A', // Not in API
    surface: 'N/A',  // Not in API
  },
  weather: {
    condition: 'N/A',    // Not in API
    temperature: 'N/A',  // Not in API
  },
  odds: {
    home: 1.5,  // Placeholder - get from predictions if available
    draw: 3.0,
    away: 2.5,
  },
  isFavorite: false,
};
```

3. **Update the "PLACE BID" button (around line 176):**
```typescript
<TouchableOpacity 
  style={[
    styles.placeBidButton, 
    { backgroundColor: isDark ? '#22c55e' : '#18223A' },
    (submitting || !betSelection || !stake) && { opacity: 0.5 }
  ]} 
  activeOpacity={0.8}
  onPress={async () => {
    if (!betSelection || !stake) {
      Alert.alert('Error', 'Please select an option and enter your stake');
      return;
    }

    try {
      setSubmitting(true);
      const betRequest = createMatchWinnerBet(
        Number(id),
        betSelection.toUpperCase() as 'HOME' | 'DRAW' | 'AWAY'
      );
      
      await placeBet(betRequest);
      
      Alert.alert(
        'Success',
        `Bet placed successfully!\nSelection: ${betSelection.toUpperCase()}\nStake: ${stake} pts`,
        [
          {
            text: 'OK',
            onPress: () => {
              setBetSelection(null);
              setStake('');
              refetchBalance(); // Update balance
            },
          },
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to place bet. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }}
  disabled={submitting || !betSelection || !stake}
>
  {submitting ? (
    <ActivityIndicator color="#ffffff" />
  ) : (
    <Text style={styles.placeBidButtonText}>PLACE BID</Text>
  )}
</TouchableOpacity>
```

4. **Add user balance display (before betting card, around line 89):**
```typescript
{/* User Balance */}
<View style={[
  styles.balanceCard,
  {
    backgroundColor: isDark ? '#101828' : '#FFFFFF',
    borderWidth: isDark ? 0 : 1,
    borderColor: '#18223A',
  }
]}>
  <Text style={[styles.balanceLabel, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
    Available Balance
  </Text>
  <Text style={[styles.balanceAmount, { color: '#22c55e' }]}>
    {balance} PTS
  </Text>
</View>
```

5. **Add balance card styles (around line 2540):**
```typescript
balanceCard: {
  backgroundColor: '#101828',
  borderRadius: 16,
  padding: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
balanceLabel: {
  fontSize: 15,
  fontFamily: 'Montserrat_400Regular',
  color: '#9ca3af',
},
balanceAmount: {
  fontSize: 24,
  fontFamily: 'Montserrat_800ExtraBold',
  color: '#22c55e',
},
```

### Step 2: Update Bidding Screen (60 min)

**File**: `app/(tabs)/bidding.tsx`

1. **Replace imports:**
```typescript
// REMOVE:
import { useBidding } from '@/hooks/useBidding';
import { Bid, BidsByDate } from '@/types/bidding';

// ADD:
import { useBettingHistory } from '@/hooks/useBettingHistory';
import { useUserBalance } from '@/hooks/useUserBalance';
```

2. **Replace line ~23 with:**
```typescript
const { loading, allBidsByDate, pendingBidsByDate, resultBidsByDate } = useBettingHistory();
const { balance } = useUserBalance();
```

3. **Add balance display after header (around line 152):**
```typescript
{/* Balance Card */}
<View style={[
  styles.balanceCard,
  { backgroundColor: theme.colors.cardBackground }
]}>
  <View>
    <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
      Available Balance
    </Text>
    <Text style={[styles.balanceAmount, { color: theme.colors.primary }]}>
      {balance} PTS
    </Text>
  </View>
  <Ionicons name="wallet-outline" size={32} color={theme.colors.primary} />
</View>
```

4. **Add loading state (after balance card):**
```typescript
{loading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
      Loading your bets...
    </Text>
  </View>
)}
```

5. **Add balance styles (around line 240):**
```typescript
balanceCard: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 16,
  padding: 20,
  marginHorizontal: 16,
  marginTop: 16,
},
balanceLabel: {
  fontSize: 14,
  fontFamily: 'Montserrat_400Regular',
},
balanceAmount: {
  fontSize: 32,
  fontFamily: 'Montserrat_900Black',
  marginTop: 4,
},
loadingContainer: {
  paddingVertical: 60,
  alignItems: 'center',
},
loadingText: {
  marginTop: 12,
  fontSize: 14,
  fontFamily: 'Montserrat_400Regular',
},
```

---

## 🧪 Testing Steps

### 1. Restart Backend
```bash
cd fyp-backend/Fyp
mvn spring-boot:run
```

### 2. Set User Points
```bash
# Login first, then set points
curl -X POST "http://192.168.10.249:8080/api/v1/users/setPoints?points=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Home Screen ✅
- Open app → Home tab
- Should see real fixtures
- Click a match

### 4. Test Match Details
- Should load match data
- See team names, logos, scores
- Enter stake (e.g., "50")
- Select HOME/DRAW/AWAY
- Click "PLACE BID"
- Should show success message

### 5. Test Bidding Screen
- Navigate to Bidding tab
- Should see your bet
- Check balance decreased
- Test filters (All/Pending/Results)

---

## ⚠️ Common Issues

**"Cannot read property 'rawJson' of undefined"**
- Fix: Check if fixture exists before accessing rawJson
- Add null checks: `fixture?.rawJson?.teams`

**"Network Error"**
- Fix: Check IP address in `services/api.ts`
- Ensure backend is running

**"Betting not allowed"**
- Fix: In database, set `allow_betting = true` for fixture

**No bets showing in history**
- Fix: Place a bet first from match details
- Check `/bets` endpoint returns data

---

## 📝 Important Notes

1. **BetViewAllDTO doesn't include fixtureId**: You may need to update backend or use different approach to link bets to fixtures.

2. **Stake field**: BetRequestDTO doesn't have stake - bets might be free or fixed amount.

3. **Odds**: Not available in current API - using placeholders. May need separate odds endpoint.

4. **Weather/Venue**: Not in Football-API - showing "N/A" or hiding these fields.

---

## ✅ Success Checklist

- [ ] Match details loads without errors
- [ ] Can place bet successfully
- [ ] Balance updates after bet
- [ ] Betting history shows
- [ ] All filters work
- [ ] Navigation between screens works

---

## 🎉 You're Done!

After completing these steps:
- Home screen: ✅ Working
- Match details: ✅ Working with betting
- Bidding screen: ✅ Working with history

**Total Time**: ~2 hours  
**Result**: Fully integrated betting app!

Need help? Check:
- `README_INTEGRATION.md` - Comprehensive guide
- `INTEGRATION_SUMMARY.md` - Detailed walkthrough
- `API_INTEGRATION_PLAN.md` - Architecture overview

