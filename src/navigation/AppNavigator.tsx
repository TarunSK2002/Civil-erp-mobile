import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { colors } from '../theme/colors';
import { View, ActivityIndicator } from 'react-native';
import { LayoutDashboard, Users, Home, HardHat, DollarSign, MoreHorizontal } from 'lucide-react-native';

import SiteListScreen from '../screens/sites/SiteListScreen';
import SiteDetailScreen from '../screens/sites/SiteDetailScreen';
import ClientListScreen from '../screens/clients/ClientListScreen';
import AttendancePaySheetScreen from '../screens/attendance/AttendancePaySheetScreen';
import LabourListScreen from '../screens/labour/LabourListScreen';
import WeeklyPayListScreen from '../screens/weekly-pay/WeeklyPayListScreen';
import WeeklyPayDetailScreen from '../screens/weekly-pay/WeeklyPayDetailScreen';
import PaymentListScreen from '../screens/payments/PaymentListScreen';

// Phase 3 Modules
import DealerListScreen from '../screens/materials/DealerListScreen';
import PurchaseListScreen from '../screens/materials/PurchaseListScreen';
import PurchaseFormScreen from '../screens/materials/PurchaseFormScreen';
import PersonTypeScreen from '../screens/masters/PersonTypeScreen';
import ShiftMasterScreen from '../screens/masters/ShiftMasterScreen';
import PettyCashScreen from '../screens/expenses/PettyCashScreen';
import MoreMenuScreen from '../screens/more/MoreMenuScreen';

// ──── Sites Stack ────────────────────────────────────────────────────────────

const SitesStack = createNativeStackNavigator();
function SitesStackNavigator() {
  return (
    <SitesStack.Navigator screenOptions={{ headerShown: false }}>
      <SitesStack.Screen name="SiteList" component={SiteListScreen} />
      <SitesStack.Screen name="SiteDetail" component={SiteDetailScreen} />
    </SitesStack.Navigator>
  );
}

// ──── Labour Stack ───────────────────────────────────────────────────────────

const LabourStack = createNativeStackNavigator();
function LabourStackNavigator() {
  return (
    <LabourStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark.bgSecondary },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <LabourStack.Screen
        name="AttendanceSheet"
        component={AttendancePaySheetScreen}
        options={{ headerShown: false }}
      />
      <LabourStack.Screen
        name="LabourList"
        component={LabourListScreen}
        options={{ title: 'Labour Master' }}
      />
      <LabourStack.Screen
        name="WeeklyPayList"
        component={WeeklyPayListScreen}
        options={{ title: 'Weekly Pay Sheets' }}
      />
      <LabourStack.Screen
        name="WeeklyPayDetail"
        component={WeeklyPayDetailScreen}
        options={{ title: 'Weekly Pay Details' }}
      />
    </LabourStack.Navigator>
  );
}

// ──── Finance Stack ───────────────────────────────────────────────────────────

const FinanceStack = createNativeStackNavigator();
function FinanceStackNavigator() {
  return (
    <FinanceStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark.bgSecondary },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <FinanceStack.Screen
        name="PaymentList"
        component={PaymentListScreen}
        options={{ title: 'Payments' }}
      />
      <FinanceStack.Screen
        name="PettyCash"
        component={PettyCashScreen}
        options={{ title: 'Petty Cash & Expenses' }}
      />
      <FinanceStack.Screen
        name="PurchaseList"
        component={PurchaseListScreen}
        options={{ title: 'Material Purchases' }}
      />
      <FinanceStack.Screen
        name="PurchaseForm"
        component={PurchaseFormScreen}
        options={{ title: 'New Material Purchase' }}
      />
    </FinanceStack.Navigator>
  );
}

// ──── More Stack ─────────────────────────────────────────────────────────────

const MoreStack = createNativeStackNavigator();
function MoreStackNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark.bgSecondary },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <MoreStack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ title: 'More Modules' }}
      />
      <MoreStack.Screen
        name="DealerList"
        component={DealerListScreen}
        options={{ title: 'Material Dealers' }}
      />
      <MoreStack.Screen
        name="PersonType"
        component={PersonTypeScreen}
        options={{ title: 'Person Types (Wage Rates)' }}
      />
      <MoreStack.Screen
        name="ShiftMaster"
        component={ShiftMasterScreen}
        options={{ title: 'Shift Master' }}
      />
    </MoreStack.Navigator>
  );
}

// ──── Tab Navigator ──────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

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
        headerTitleStyle: { fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
          if (route.name === 'Sites') return <Home color={color} size={size} />;
          if (route.name === 'Labour') return <HardHat color={color} size={size} />;
          if (route.name === 'Clients') return <Users color={color} size={size} />;
          if (route.name === 'Finance') return <DollarSign color={color} size={size} />;
          if (route.name === 'More') return <MoreHorizontal color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sites" component={SitesStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Labour" component={LabourStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Clients" component={ClientListScreen} />
      <Tab.Screen name="Finance" component={FinanceStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="More" component={MoreStackNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// ──── Root Navigator ─────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

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
