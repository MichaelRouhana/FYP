// app/admin/logs.tsx
// Full System Logs Page

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getDashboardLogs, DashboardLog } from '@/services/dashboardApi';

export default function AdminLogsPage() {
  const colorScheme = useColorScheme() ?? 'light';

  const [logs, setLogs] = useState<DashboardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const humanizeAction = useCallback((action?: string) => {
    const a = (action || '').trim();
    if (!a) return 'performed an action';

    const lower = a.toLowerCase();
    if (lower.startsWith("retrieve dashboard's ")) {
      const rest = a.slice("retrieve dashboard's ".length).trim();
      return `viewed the dashboard ${rest}`;
    }
    if (lower.startsWith('retrieve ')) {
      const rest = a.slice('retrieve '.length).trim();
      return `retrieved ${rest}`;
    }
    if (lower.startsWith('get ')) {
      const rest = a.slice('get '.length).trim();
      return `requested ${rest}`;
    }
    return a.charAt(0).toLowerCase() + a.slice(1);
  }, []);

  const formatLogSentence = useCallback(
    (log: DashboardLog) => {
      const username = log.username || 'unknown user';
      const actionPhrase = humanizeAction(log.action);
      const time = log.timestamp
        ? new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : 'Unknown time';

      // Per request: do NOT include endpoints/method/path
      return `At ${time}, ${username} ${actionPhrase}.`;
    },
    [humanizeAction]
  );

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const rows = await getDashboardLogs({ page: 0, size: 50 });
      setLogs(rows);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loading}>
          <Text style={{ color: Colors[colorScheme].muted }}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>System Logs</Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].muted }]}>{logs.length} rows</Text>

        <View style={[styles.divider, { backgroundColor: Colors[colorScheme].border }]} />

        {logs.length === 0 ? (
          <Text style={{ color: Colors[colorScheme].muted }}>No logs available.</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={[styles.row, { borderBottomColor: Colors[colorScheme].border }]}>
              <Text style={[styles.rowText, { color: Colors[colorScheme].muted }]}>{formatLogSentence(log)}</Text>
            </View>
          ))
        )}
      </View>
    );
  }, [colorScheme, error, formatLogSentence, loading, logs]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
        {/* Custom Header (match Admin Users style) */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme].background, borderBottomColor: Colors[colorScheme].border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>System Logs</Text>
          <View style={styles.backButton} />
        </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[colorScheme].tint} />}
      >
        {content}
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loading: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.7,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});


