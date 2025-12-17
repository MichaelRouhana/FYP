import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';

interface InfoCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  isDark?: boolean;
  theme?: { colors: ThemeColors };
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, isDark = true, theme }) => {
  const iconColor = theme?.colors?.iconMuted || '#667085';
  const backgroundColor = theme?.colors?.cardBackground || '#111828';
  const borderColor = theme?.colors?.border || '#1A253D';
  const valueColor = theme?.colors?.text || '#ffffff';
  const labelColor = isDark ? '#B3B3B3' : theme?.colors?.textMuted || '#B3B3B3';

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    gap: 10,
  },
  icon: {
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
  },
});

export default InfoCard;

