import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayName, getRoleColor } from '../../utils/roleHelpers';
import adminService from '../../services/adminService';
import { UserSummary } from '../../types';
import { Search, Plus, EyeOff, Eye, Trash2, Lock, ChevronLeft } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'UserList'>;

const UserListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { role } = route.params;
  const { hasAction } = useAuth();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const roleDisplayName = getRoleDisplayName(role);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (pageNumber = 0) => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({ role, page: pageNumber, size: 10 });

      if (pageNumber === 0) {
        setUsers(response.content);
      } else {
        setUsers([...users, ...response.content]);
      }

      setPage(response.number);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to load ${roleDisplayName.toLowerCase()}s`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await loadUsers(0);
  };

  const handleLoadMore = () => {
    if (page < totalPages - 1 && !loading) {
      loadUsers(page + 1);
    }
  };

  const getActionName = () => {
    switch (role) {
      case 'PATIENT':
        return 'VIEW_PATIENT';
      case 'DIETICIAN':
        return 'VIEW_DIETICIAN';
      default:
        return '';
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean, fullName: string) => {
    const activateAction = role === 'PATIENT' ? 'ACTIVATE_PATIENT' : 'ACTIVATE_DIETICIAN';
    const deactivateAction = role === 'PATIENT' ? 'DEACTIVATE_PATIENT' : 'DEACTIVATE_DIETICIAN';
    const action = currentStatus ? deactivateAction : activateAction;

    if (!hasAction(action)) {
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
      return;
    }

    Alert.alert(
      currentStatus ? 'Deactivate User' : 'Activate User',
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${fullName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.setUserStatus(userId, !currentStatus);
              await handleRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async (userId: number, fullName: string) => {
    const action = role === 'PATIENT' ? 'RESET_PATIENT_PASSWORD' : 'RESET_DIETICIAN_PASSWORD';

    if (!hasAction(action)) {
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Are you sure you want to reset the password for ${fullName || 'this user'}? A temporary password will be emailed to them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await adminService.resetPassword(userId);
              Alert.alert('Success', response.message);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reset password');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId: number, fullName: string) => {
    const action = role === 'PATIENT' ? 'DELETE_PATIENT' : 'DELETE_DIETICIAN';

    if (!hasAction(action)) {
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${fullName || 'this user'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(userId);
              await handleRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserSummary }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(item.roleCode) }]}>
          <Text style={styles.avatarText}>
            {item.fullName?.charAt(0) || item.email.charAt(0)}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullName || 'Unknown'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.badges}>
            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusBadgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.emailVerified ? '#3B82F6' : '#F59E0B' }]}>
              <Text style={styles.statusBadgeText}>{item.emailVerified ? 'Verified' : 'Pending'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {(hasAction(role === 'PATIENT' ? 'ACTIVATE_PATIENT' : 'ACTIVATE_DIETICIAN') ||
          hasAction(role === 'PATIENT' ? 'DEACTIVATE_PATIENT' : 'DEACTIVATE_DIETICIAN')) && (
          <TouchableOpacity
            style={[styles.actionButton, item.isActive ? styles.deactivateBtn : styles.activateBtn]}
            onPress={() => handleToggleStatus(item.id, item.isActive, item.fullName || '')}
          >
            {item.isActive ? <EyeOff size={18} color="#fff" /> : <Eye size={18} color="#fff" />}
          </TouchableOpacity>
        )}
        {hasAction(role === 'PATIENT' ? 'RESET_PATIENT_PASSWORD' : 'RESET_DIETICIAN_PASSWORD') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resetBtn]}
            onPress={() => handleResetPassword(item.id, item.fullName || '')}
          >
            <Lock size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {hasAction(role === 'PATIENT' ? 'DELETE_PATIENT' : 'DELETE_DIETICIAN') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteBtn]}
            onPress={() => handleDeleteUser(item.id, item.fullName || '')}
          >
            <Trash2 size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No {roleDisplayName.toLowerCase()}s found</Text>
      <Text style={styles.emptySubtext}>
        {role === 'PATIENT' ? 'No patients registered yet' : 'No dieticians found'}
      </Text>
    </View>
  );

  const canCreate = role === 'PATIENT' ? hasAction('CREATE_PATIENT') : hasAction('CREATE_DIETICIAN');

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{roleDisplayName}s</Text>
        </View>
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateUser' as never, { role } as never)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${roleDisplayName.toLowerCase()}s...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading && users.length > 0 ? <ActivityIndicator style={styles.loader} color="#6366f1" /> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateBtn: {
    backgroundColor: '#10B981',
  },
  deactivateBtn: {
    backgroundColor: '#F59E0B',
  },
  resetBtn: {
    backgroundColor: '#6366f1',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  loader: {
    marginVertical: 20,
  },
});

export default UserListScreen;
