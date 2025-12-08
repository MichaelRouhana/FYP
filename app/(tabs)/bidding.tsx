import React, { useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import { Button, Card, ProgressBar, RadioButton, Text, TextInput } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradientBackground } from '@/components/GradientBackground';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { matches } from '@/mock/matches';

export default function BiddingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [result, setResult] = useState<'win' | 'draw' | 'lose'>('win');
  const [points, setPoints] = useState('50');
  const [balance, setBalance] = useState(500);
  const [confirming, setConfirming] = useState(false);
  const match = useMemo(() => matches[0], []);
  const implied = useMemo(() => ({ win: 0.55, draw: 0.22, lose: 0.23 }), []);

  const onStake = () => {
    const stake = Math.max(0, parseInt(points || '0', 10));
    if (!Number.isFinite(stake) || stake <= 0 || stake > balance) return;
    setBalance(b => b - stake);
    setConfirming(true);
    setTimeout(() => setConfirming(false), 900);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <GradientBackground>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardDismissMode={Platform.select({ ios: 'on-drag', android: 'on-drag' })}
            keyboardShouldPersistTaps="handled"
          >
          <Text variant="titleLarge" style={{ marginBottom: 12 }}>Place Your Prediction</Text>

          {/* Match summary with logos */}
          <Card mode="contained" style={{ backgroundColor: Colors[colorScheme].card, borderRadius: 14, marginBottom: 12 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, marginRight: 10 }}>
                  {match.homeLogoUrl ? (
                    <Image source={{ uri: match.homeLogoUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium">{match.homeTeam}</Text>
                  <Text variant="titleMedium">{match.awayTeam}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="headlineSmall">{(match.homeScore ?? 0)} - {(match.awayScore ?? 0)}</Text>
                </View>
              </View>
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                {match.leagueLogoUrl ? (
                  <Image source={{ uri: match.leagueLogoUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
                ) : (
                  <Ionicons name="trophy-outline" size={16} color={Colors[colorScheme].muted} />
                )}
                <Text variant="labelLarge" style={{ marginLeft: 6, color: Colors[colorScheme].muted }}>{match.tournament}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Balance meter */}
          <Card mode="contained" style={{ backgroundColor: Colors[colorScheme].card, borderRadius: 14, marginBottom: 12 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="cash-outline" size={18} color={Colors[colorScheme].tint} />
                <Text variant="labelLarge" style={{ marginLeft: 6 }}>Balance</Text>
                <View style={{ flex: 1 }} />
                <Text variant="labelLarge">{balance} pts</Text>
              </View>
              <ProgressBar progress={Math.min(1, balance / 1000)} color={Colors[colorScheme].tint} />
            </Card.Content>
          </Card>
          <RadioButton.Group onValueChange={(v) => setResult(v as any)} value={result}>
            <RadioButton.Item label="Home Win" value="win" />
            <RadioButton.Item label="Draw" value="draw" />
            <RadioButton.Item label="Away Win" value="lose" />
          </RadioButton.Group>
          {/* Odds / prediction confidence visuals */}
          <View style={{ marginTop: 8 }}>
            <ProbRow label="Home Win" value={implied.win} color={Colors[colorScheme].success} />
            <ProbRow label="Draw" value={implied.draw} color={Colors[colorScheme].warning} />
            <ProbRow label="Away Win" value={implied.lose} color={Colors[colorScheme].danger} />
          </View>
          <TextInput
            label="Points to stake"
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
            returnKeyType="done"
            style={{ marginTop: 12 }}
            onSubmitEditing={Keyboard.dismiss}
            blurOnSubmit
          />
          <AnimatedPressable>
            <Button mode="contained" style={{ marginTop: 16 }} onPress={onStake}>
              Stake Points
            </Button>
          </AnimatedPressable>
          <AnimatedPressable>
            <Button mode="outlined" style={{ marginTop: 12 }} onPress={() => {}}>
              View Rewards
            </Button>
          </AnimatedPressable>
          {/* Rewards preview */}
          <Card mode="contained" style={{ backgroundColor: Colors[colorScheme].card, borderRadius: 14, marginTop: 12 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift" size={20} color={Colors[colorScheme].tint} />
                <Text variant="titleMedium" style={{ marginLeft: 8 }}>Rewards Preview</Text>
              </View>
              <Text variant="labelLarge" style={{ marginTop: 6, color: Colors[colorScheme].muted }}>500 pts: Free Match Ticket Raffle</Text>
              <Text variant="labelLarge" style={{ marginTop: 2, color: Colors[colorScheme].muted }}>1000 pts: Club Jersey Discount</Text>
            </Card.Content>
          </Card>

          {confirming && <ConfirmToast />}
          </ScrollView>
        </GradientBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function ProbRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ marginVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
        <Text variant="labelLarge">{label}</Text>
        <View style={{ flex: 1 }} />
        <Text variant="labelLarge">{Math.round(value * 100)}%</Text>
      </View>
      <ProgressBar progress={Math.min(1, Math.max(0, value))} color={color} />
    </View>
  );
}

function ConfirmToast() {
  const o = useSharedValue(0);
  const s = useSharedValue(0.9);
  useEffect(() => {
    o.value = withTiming(1, { duration: 180 });
    s.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ scale: s.value }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: 24, left: 16, right: 16 }]}> 
      <Animated.View style={[{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' }, style]}>
        <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
        <Text variant="labelLarge" style={{ marginTop: 6 }}>Staked!</Text>
      </Animated.View>
    </Animated.View>
  );
}


