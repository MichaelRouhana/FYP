# ✅ Testing Checklist - Backend Integration

## Pre-Testing Setup

### 1. Backend Running
```bash
cd fyp-backend/Fyp
mvn spring-boot:run
```
- [ ] Backend started successfully
- [ ] No errors in console
- [ ] Running on correct port (8080)

### 2. Check API Configuration
File: `fyp-football-ui/services/api.ts`
- [ ] `IP_ADDRESS` matches your backend IP
- [ ] `PORT` is 8080
- [ ] `BASE_URL` is correct

### 3. User Setup
- [ ] User account created (signup)
- [ ] User logged in (has JWT token)
- [ ] User has points (use `/users/setPoints?points=1000`)

### 4. Fixtures Setup
- [ ] Fixtures synced in database
- [ ] Fixtures have `showMatch: true`
- [ ] Fixtures have `allowBetting: true`

---

## Test Scenarios

### ✅ Home Screen (Already Working)

- [ ] **App opens successfully**
- [ ] **Home tab loads**
- [ ] **Fixtures display**
  - [ ] Team names visible
  - [ ] Team logos load
  - [ ] Scores show (if available)
  - [ ] League names display
- [ ] **HOT indicator**
  - [ ] Fire icon on matches with 100+ bets
- [ ] **Filters work**
  - [ ] ALL shows all matches
  - [ ] LIVE shows only live matches
  - [ ] UPCOMING shows only upcoming
- [ ] **Navigation**
  - [ ] Click match → Opens match details

**Status**: ✅ PASS / ❌ FAIL

---

### ✅ Match Details Screen

#### Loading State
- [ ] **Shows loading indicator**
  - [ ] Spinner displays
  - [ ] "Loading match data..." text shows
  - [ ] No errors during load

#### Match Data Display
- [ ] **Header shows**
  - [ ] League name
  - [ ] Match date
  - [ ] Team names
  - [ ] Team logos (or initials)
  - [ ] Current score
  - [ ] Match time/status

#### Balance Display
- [ ] **Balance card visible**
  - [ ] Shows "Available Balance"
  - [ ] Points amount displays (e.g., "1000 PTS")
  - [ ] Green color for amount

#### Betting Section
- [ ] **Betting options**
  - [ ] HOME button clickable
  - [ ] DRAW button clickable
  - [ ] AWAY button clickable
  - [ ] Selected option highlights

- [ ] **Stake input**
  - [ ] Can type numbers
  - [ ] Shows "pts" unit
  - [ ] Accepts decimal values

- [ ] **Potential winnings**
  - [ ] Updates when stake changes
  - [ ] Updates when selection changes
  - [ ] Shows correct calculation

#### Placing a Bet
- [ ] **Validation**
  - [ ] Error if no selection made
  - [ ] Error if no stake entered
  - [ ] Error if stake > balance
  - [ ] Error if stake <= 0

- [ ] **Successful bet**
  - [ ] Button shows loading indicator
  - [ ] Success alert displays
  - [ ] Shows bet details in alert
  - [ ] Balance decreases
  - [ ] Form resets (selection & stake cleared)

- [ ] **Error handling**
  - [ ] Shows error alert if bet fails
  - [ ] Error message from backend displayed
  - [ ] Form stays filled (can retry)

#### Tab Navigation
- [ ] **All tabs accessible**
  - [ ] DETAILS tab works
  - [ ] PREDICTIONS tab works
  - [ ] SUMMARY tab works (mock data)
  - [ ] LINEUP tab works (mock data)
  - [ ] STANDINGS tab works (mock data)
  - [ ] COMMENTARY tab works (mock data)
  - [ ] STATS tab works (mock data)
  - [ ] H2H tab works (mock data)
  - [ ] POWER tab works (mock data)

**Status**: ✅ PASS / ❌ FAIL

---

### ✅ Bidding Screen

#### Loading State
- [ ] **Shows loading indicator**
  - [ ] Spinner displays
  - [ ] "Loading your bets..." text shows

#### Balance Display
- [ ] **Balance card visible**
  - [ ] Shows "Available Balance"
  - [ ] Points amount displays
  - [ ] Wallet icon shows
  - [ ] Green color for amount

#### Bet History
- [ ] **Bets display**
  - [ ] List of bets shows
  - [ ] Grouped by date
  - [ ] Date headers visible
  - [ ] Most recent first

- [ ] **Bet cards show**
  - [ ] Match time
  - [ ] Team names
  - [ ] Team logos
  - [ ] Scores (if match finished)
  - [ ] Stake amount
  - [ ] Status icon

#### Status Icons
- [ ] **Pending bets**
  - [ ] Clock icon (⏱)
  - [ ] Gray color

- [ ] **Won bets**
  - [ ] Checkmark icon (✓)
  - [ ] Green color

- [ ] **Lost bets**
  - [ ] X icon (✗)
  - [ ] Red color

#### Filters
- [ ] **ALL filter**
  - [ ] Shows all bets
  - [ ] Highlights when selected

- [ ] **PENDING filter**
  - [ ] Shows only pending bets
  - [ ] Highlights when selected

- [ ] **RESULTS filter**
  - [ ] Shows only won/lost bets
  - [ ] Highlights when selected

#### Navigation
- [ ] **Click bet card**
  - [ ] Navigates to match details
  - [ ] Correct match opens

#### Empty State
- [ ] **No bets scenario**
  - [ ] Trophy icon shows
  - [ ] "No bids found" message
  - [ ] Helpful subtext displays

**Status**: ✅ PASS / ❌ FAIL

---

## Integration Tests

### End-to-End Flow
- [ ] **Complete betting flow**
  1. [ ] Open app
  2. [ ] Navigate to Home
  3. [ ] Click a match
  4. [ ] Note current balance
  5. [ ] Enter stake (e.g., 50)
  6. [ ] Select HOME
  7. [ ] Click "PLACE BID"
  8. [ ] See success message
  9. [ ] Balance decreased by 50
  10. [ ] Navigate to Bidding tab
  11. [ ] See new bet in list
  12. [ ] Bet shows as PENDING
  13. [ ] Click bet
  14. [ ] Returns to match details

**Status**: ✅ PASS / ❌ FAIL

---

## Error Scenarios

### Network Errors
- [ ] **Backend offline**
  - [ ] Home screen shows error
  - [ ] Match details shows error
  - [ ] Bidding shows empty state

- [ ] **Slow network**
  - [ ] Loading indicators show
  - [ ] Eventually loads or times out

### API Errors
- [ ] **Invalid fixture ID**
  - [ ] Shows error screen
  - [ ] Can go back

- [ ] **Betting not allowed**
  - [ ] Shows error alert
  - [ ] Explains why

- [ ] **Insufficient balance**
  - [ ] Shows error alert
  - [ ] Mentions current balance

### Edge Cases
- [ ] **No fixtures available**
  - [ ] Home shows empty state
  - [ ] Helpful message displays

- [ ] **No bets placed**
  - [ ] Bidding shows empty state
  - [ ] Encourages placing bets

- [ ] **Very long team names**
  - [ ] Text truncates properly
  - [ ] Doesn't break layout

**Status**: ✅ PASS / ❌ FAIL

---

## Performance Tests

- [ ] **Home screen loads < 3 seconds**
- [ ] **Match details loads < 2 seconds**
- [ ] **Bet submission < 1 second**
- [ ] **Bidding history loads < 3 seconds**
- [ ] **No memory leaks (test by navigating repeatedly)**
- [ ] **Smooth scrolling on all screens**
- [ ] **Images load progressively**

**Status**: ✅ PASS / ❌ FAIL

---

## Device Tests

### iOS
- [ ] iPhone (if available)
- [ ] iPad (if available)

### Android
- [ ] Android Phone
- [ ] Android Tablet (if available)

### Emulator/Simulator
- [ ] iOS Simulator
- [ ] Android Emulator

**Status**: ✅ PASS / ❌ FAIL

---

## Final Checklist

- [ ] All tests passed
- [ ] No console errors
- [ ] No crashes
- [ ] UI looks good
- [ ] Animations smooth
- [ ] Loading states work
- [ ] Error handling works
- [ ] Navigation works
- [ ] Data persists correctly

---

## Common Issues & Solutions

### Issue: "Network Error"
**Solution**: Check IP address in `services/api.ts`

### Issue: No fixtures showing
**Solution**: Sync fixtures in database, check `showMatch: true`

### Issue: Can't place bet
**Solution**: Check `allowBetting: true` in fixture settings

### Issue: "Insufficient points"
**Solution**: Use `/users/setPoints?points=1000` endpoint

### Issue: Bet history empty
**Solution**: Place a bet first from match details

### Issue: Images not loading
**Solution**: Check internet connection, verify image URLs

---

## Sign-Off

**Tester Name**: ___________________

**Date**: ___________________

**Overall Status**: ✅ PASS / ❌ FAIL

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

**Integration Complete!** 🎉

If all tests pass, the app is ready for:
- User acceptance testing
- Demo/presentation
- Production deployment

Great work! 🚀

