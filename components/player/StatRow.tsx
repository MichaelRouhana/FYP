import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatRowProps {
  label: string;
  value: string | number;
  isLast?: boolean;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, isLast = false }) => {
  return (
    <View style={[styles.container, !isLast && styles.withBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#222F4E',
  },
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#ffffff',
  },
  value: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
});

export default StatRow;

