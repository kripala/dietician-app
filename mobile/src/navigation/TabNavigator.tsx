/**
 * Bottom Tab Navigator
 * Main app navigation with Home, Profile, and Admin tabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Home, User, Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roleHelpers';

// Screens
import HomeScreen from '../screens/HomeScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Tab = createBottomTabNavigator();

type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Admin: undefined;
};

// Tab Bar Icon Component
interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const HomeIcon: React.FC<TabBarIconProps> = ({ focused, color, size }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Home size={size} color={focused ? '#4F46E5' : color} />
  </View>
);

const ProfileIcon: React.FC<TabBarIconProps> = ({ focused, color, size }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <User size={size} color={focused ? '#4F46E5' : color} />
  </View>
);

const AdminIcon: React.FC<TabBarIconProps> = ({ focused, color, size }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Shield size={size} color={focused ? '#4F46E5' : color} />
  </View>
);

const TabNavigator: React.FC = () => {
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user?.role);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: (props) => <HomeIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => <ProfileIcon {...props} />,
        }}
      />
      {userIsAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: (props) => <AdminIcon {...props} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBarIcon: {
    marginBottom: 4,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
  },
  iconContainerFocused: {
    backgroundColor: '#EEF2FF',
  },
});

export default TabNavigator;
