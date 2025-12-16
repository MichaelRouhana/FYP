import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatSectionProps {
  title: string;
  children: React.ReactNode;
}

export const StatSection: React.FC<StatSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: '#080C17',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#1A253D',
    marginHorizontal: 16,
  },
});

export default StatSection;

