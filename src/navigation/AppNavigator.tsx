import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { colors } from '../theme/colors';
import { View, ActivityIndicator, Text } from 'react-native';
import { LayoutDashboard, Users, Home, HardHat, DollarSign } from 'lucide-react-native';

import SiteListScreen from '../screens/sites/SiteListScreen';
import SiteDetailScreen from '../screens/sites/SiteDetailScreen';

const SitesStack = createNativeStackNavigator();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SitesStackNavigator() {
  return (
    <SitesStack.Navigator screenOptions={{ headerShown: false }}>
      <SitesStack.Screen name="SiteList" component={SiteListScreen} />
      <SitesStack.Screen name="SiteDetail" component={SiteDetailScreen} />
    </SitesStack.Navigator>
  );
}

// Temporary stub pages for navigation setup
const LabourPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: colors.dark.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: colors.dark.textPrimary }}>Labour Page Placeholder</Text>
  </View>
);

import ClientListScreen from '../screens/clients/ClientListScreen';
import AttendancePaySheetScreen from '../screens/attendance/AttendancePaySheetScreen';

const FinancePlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: colors.dark.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: colors.dark.textPrimary }}>Finance Page Placeholder</Text>
  </View>
);

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: colors.dark.bgSecondary,
          borderTopColor: colors.dark.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.dark.accent,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        headerStyle: {
          backgroundColor: colors.dark.bgSecondary,
          borderBottomColor: colors.dark.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') {
            return <LayoutDashboard color={color} size={size} />;
          } else if (route.name === 'Sites') {
            return <Home color={color} size={size} />;
          } else if (route.name === 'Labour') {
            return <HardHat color={color} size={size} />;
          } else if (route.name === 'Clients') {
            return <Users color={color} size={size} />;
          } else if (route.name === 'Finance') {
            return <DollarSign color={color} size={size} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sites" component={SitesStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Labour" component={AttendancePaySheetScreen} />
      <Tab.Screen name="Clients" component={ClientListScreen} />
      <Tab.Screen name="Finance" component={FinancePlaceholder} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
