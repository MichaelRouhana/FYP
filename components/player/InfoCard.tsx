import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface InfoCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={20} color="#667085" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    borderWidth: 1,
    borderColor: '#1A253D',
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
    color: '#ffffff',
    marginBottom: 2,
  },
  label: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#B3B3B3',
  },
});

export default InfoCard;

