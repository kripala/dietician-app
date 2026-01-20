import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import AppHeader from '../../components/AppHeader';
import { Users, UserPlus, Settings, Activity } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  color,
  onPress,
  disabled = false,
}) => {
  const handlePress = () => {
    console.log('ModuleCard pressed:', title);
    if (onPress && !disabled) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.moduleCard, disabled && styles.disabledCard]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

const AdminDashboardScreen: React.FC<Props> = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Temporarily enable all features for admin users
  // TODO: Implement proper action-based permissions once backend returns actions array
  const canViewPatients = user?.role === 'ADMIN';
  const canViewDieticians = user?.role === 'ADMIN';
  const canCreatePatient = user?.role === 'ADMIN';
  const canCreateDietician = user?.role === 'ADMIN';
  const canManageRoles = user?.role === 'ADMIN';

  const navigateToPatients = () => {
    console.log('Navigating to UserList with role: PATIENT');
    (navigation as any).push('UserList', { role: 'PATIENT' });
  };

  const navigateToDieticians = () => {
    console.log('Navigating to UserList with role: DIETICIAN');
    (navigation as any).push('UserList', { role: 'DIETICIAN' });
  };

  const navigateToCreatePatient = () => {
    console.log('Navigating to CreateUser with role: PATIENT');
    (navigation as any).push('CreateUser', { role: 'PATIENT' });
  };

  const navigateToCreateDietician = () => {
    console.log('Navigating to CreateUser with role: DIETICIAN');
    (navigation as any).push('CreateUser', { role: 'DIETICIAN' });
  };

  const navigateToRoleManagement = () => {
    console.log('Navigating to RoleManagement');
    (navigation as any).push('RoleManagement');
  };

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} title="Admin Dashboard" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Admin'}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Users size={24} color="#667eea" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>Active Users</Text>
              <Text style={styles.statLabel}>Manage your team</Text>
            </View>
          </View>
        </View>

        {/* User Management Modules */}
        <Text style={styles.sectionTitle}>User Management</Text>
        <View style={styles.modulesGrid}>
          <ModuleCard
            title="Patients"
            description="View and manage patient records"
            icon={<Users size={32} color="#667eea" />}
            color="#667eea"
            onPress={navigateToPatients}
            disabled={!canViewPatients}
          />
          <ModuleCard
            title="Dieticians"
            description="View and manage dietician records"
            icon={<Users size={32} color="#667eea" />}
            color="#667eea"
            onPress={navigateToDieticians}
            disabled={!canViewDieticians}
          />
        </View>

        {/* Actions Section */}
        {(canCreatePatient || canCreateDietician) && (
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.modulesGrid}>
              {canCreatePatient && (
                <ModuleCard
                  title="Add Patient"
                  description="Create a new patient account"
                  icon={<UserPlus size={32} color="#667eea" />}
                  color="#667eea"
                  onPress={navigateToCreatePatient}
                />
              )}
              {canCreateDietician && (
                <ModuleCard
                  title="Add Dietician"
                  description="Create a new dietician account"
                  icon={<UserPlus size={32} color="#667eea" />}
                  color="#667eea"
                  onPress={navigateToCreateDietician}
                />
              )}
            </View>
          </>
        )}

        {/* Administration Section */}
        {canManageRoles && (
          <>
            <Text style={styles.sectionTitle}>Administration</Text>
            <View style={styles.modulesGrid}>
              <ModuleCard
                title="Role Management"
                description="Manage roles and permissions"
                icon={<Settings size={32} color="#F59E0B" />}
                color="#F59E0B"
                onPress={navigateToRoleManagement}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default AdminDashboardScreen;
