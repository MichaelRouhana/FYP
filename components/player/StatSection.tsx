import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';

interface StatSectionProps {
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
  theme?: { colors: ThemeColors };
}

export const StatSection: React.FC<StatSectionProps> = ({ title, children, isDark = true, theme }) => {
  const backgroundColor = theme?.colors?.background || '#080C17';
  const borderColor = theme?.colors?.border || '#1A253D';
  const titleColor = theme?.colors?.text || '#ffffff';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <View style={[styles.content, { backgroundColor, borderColor }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  title: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  content: {
    borderRadius: 5,
    borderWidth: 1,
  },
});

export default StatSection;

