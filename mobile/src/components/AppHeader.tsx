import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Home } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProfileMenu from './ProfileMenu';

interface AppHeaderProps {
  navigation?: NativeStackNavigationProp<any>;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  title?: string;
  showProfileMenu?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  navigation,
  showBackButton = false,
  showHomeButton = false,
  title,
  showProfileMenu = true,
}) => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBackButton && navigation && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.navButton}
          >
            <ChevronLeft size={24} color="#4F46E5" />
          </TouchableOpacity>
        )}
        {showHomeButton && navigation && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.navButton}
          >
            <Home size={24} color="#4F46E5" />
          </TouchableOpacity>
        )}
        {title && (
          <View>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        {!title && (
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          </View>
        )}
      </View>
      <View style={styles.headerRight}>
        {showProfileMenu && <ProfileMenu navigation={navigation} onLogout={logout} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  greeting: {
    fontSize: 16,
    color: '#6c757d',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
});

export default AppHeader;
