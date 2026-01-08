import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useProfile } from '@/hooks/useProfile';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={color}
      style={{ marginBottom: -4 }}
    />
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useProfile();

  // Check if user has ADMIN or DEVELOPER role
  const isAdmin = user?.roles?.some(
    (role) => role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'DEVELOPER'
  ) || false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat_500Medium',
          fontSize: 11,
        },
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bidding"
        options={{
          title: 'Bidding',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="trophy" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chat" color={color} focused={focused} />
          ),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account-circle" color={color} focused={focused} />
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'DashBoard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="speedometer-outline" size={24} color={color} style={{ marginBottom: -4 }} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({});