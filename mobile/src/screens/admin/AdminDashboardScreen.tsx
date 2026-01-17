import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
}) => (
  <TouchableOpacity
    style={[styles.moduleCard, disabled && styles.disabledCard]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <Text style={styles.moduleTitle}>{title}</Text>
    <Text style={styles.moduleDescription}>{description}</Text>
  </TouchableOpacity>
);

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, hasAction } = useAuth();

  const canViewPatients = hasAction('VIEW_PATIENT');
  const canViewDieticians = hasAction('VIEW_DIETICIAN');
  const canCreatePatient = hasAction('CREATE_PATIENT');
  const canCreateDietician = hasAction('CREATE_DIETICIAN');
  const canManageRoles = hasAction('MANAGE_ROLES');

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
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Users size={24} color="#6366f1" />
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
            icon={<Users size={32} color="#10B981" />}
            color="#10B981"
            onPress={() => navigation.navigate('UserList' as never, { role: 'PATIENT' } as never)}
            disabled={!canViewPatients}
          />
          <ModuleCard
            title="Dieticians"
            description="View and manage dietician records"
            icon={<Users size={32} color="#6366f1" />}
            color="#6366f1"
            onPress={() => navigation.navigate('UserList' as never, { role: 'DIETICIAN' } as never)}
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
                  icon={<UserPlus size={32} color="#10B981" />}
                  color="#10B981"
                  onPress={() => navigation.navigate('CreateUser' as never, { role: 'PATIENT' } as never)}
                />
              )}
              {canCreateDietician && (
                <ModuleCard
                  title="Add Dietician"
                  description="Create a new dietician account"
                  icon={<UserPlus size={32} color="#6366f1" />}
                  color="#6366f1"
                  onPress={() => navigation.navigate('CreateUser' as never, { role: 'DIETICIAN' } as never)}
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
                onPress={() => navigation.navigate('RoleManagement' as never)}
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
    borderRadius: 16,
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
    borderRadius: 16,
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
