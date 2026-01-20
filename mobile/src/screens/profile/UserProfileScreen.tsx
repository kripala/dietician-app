import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import {
  User,
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Save,
  Edit,
  X,
} from 'lucide-react-native';
import profileService from '../../services/profileService';
import { getErrorMessage } from '../../utils/errorHandler';
import AppHeader from '../../components/AppHeader';
import { showToast } from '../../utils/toast';

// Conditionally import expo-image-picker only for native platforms
let ImagePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('expo-image-picker');
  } catch (e) {
    console.warn('expo-image-picker not available');
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

interface FormData {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  countryCode: string;
  mobileNumber: string;
  country: string;
  state: string;
  addressLine: string;
  pincode: string;
}

const initialFormData: FormData = {
  email: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  countryCode: '+91',
  mobileNumber: '',
  country: '',
  state: '',
  addressLine: '',
  pincode: '',
};

export const UserProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfilePictureUrl, updateUserEmail, updateAuthTokens } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await profileService.getProfile(user.id);
      setProfile(data);

      // Populate form with existing data - use email from user context
      setFormData({
        email: user.email || '',
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        gender: (data.gender as any) || '',
        countryCode: data.countryCode || '+91',
        mobileNumber: data.mobileNumber || '',
        country: data.country || '',
        state: data.state || '',
        addressLine: data.addressLine || '',
        pincode: data.pincode || '',
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to load profile');
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') {
      // For web, create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          uploadPhotoWeb(file);
        }
      };
      input.click();
    } else if (ImagePicker) {
      // For native platforms, use expo-image-picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadPhoto(result.assets[0].uri);
      }
    } else {
      if (Platform.OS === 'web') {
        showToast.error('Image picker not available');
      } else {
        showToast.error('Image picker not available');
      }
    }
  };

  const uploadPhotoWeb = async (file: File) => {
    if (!user) return;

    try {
      setSaving(true);
      const response = await profileService.uploadPhoto(user.id, file);
      // Update profile picture URL in auth context immediately
      updateProfilePictureUrl(response.profilePhotoUrl);
      await loadProfile();
      showToast.success('Profile photo updated successfully');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to upload photo');
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!user) return;

    try {
      setSaving(true);
      const response = await profileService.uploadPhotoFromUri(user.id, uri);
      // Update profile picture URL in auth context immediately
      updateProfilePictureUrl(response.profilePhotoUrl);
      await loadProfile();
      if (Platform.OS === 'web') {
        showToast.success('Profile photo updated successfully');
      } else {
        showToast.success('Profile photo updated successfully');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to upload photo');
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      if (Platform.OS === 'web') {
        showToast.error('First name is required');
      } else {
        showToast.error('First name is required');
      }
      return;
    }

    if (!formData.lastName.trim()) {
      if (Platform.OS === 'web') {
        showToast.error('Last name is required');
      } else {
        showToast.error('Last name is required');
      }
      return;
    }

    if (!formData.dateOfBirth) {
      if (Platform.OS === 'web') {
        showToast.error('Date of birth is required');
      } else {
        showToast.error('Date of birth is required');
      }
      return;
    }

    if (!formData.gender) {
      if (Platform.OS === 'web') {
        showToast.error('Gender is required');
      } else {
        showToast.error('Gender is required');
      }
      return;
    }

    if (!formData.mobileNumber.trim()) {
      if (Platform.OS === 'web') {
        showToast.error('Mobile number is required');
      } else {
        showToast.error('Mobile number is required');
      }
      return;
    }

    try {
      setSaving(true);
      Keyboard.dismiss();

      // Store original email to check if changed
      const originalEmail = user?.email;
      const newEmail = formData.email || undefined;

      const response: any = await profileService.updateProfile(user!.id, {
        email: newEmail,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        countryCode: formData.countryCode,
        mobileNumber: formData.mobileNumber,
        country: formData.country || undefined,
        state: formData.state || undefined,
        addressLine: formData.addressLine || undefined,
        pincode: formData.pincode || undefined,
      });

      // Update auth tokens if email was changed (backend returns new tokens)
      if (response?.emailChanged && response?.accessToken && response?.refreshToken && newEmail) {
        await updateAuthTokens(newEmail, response.accessToken, response.refreshToken);
      } else if (newEmail && originalEmail && newEmail !== originalEmail) {
        // Fallback: just update email if no tokens returned
        await updateUserEmail(newEmail);
      }

      await loadProfile();
      setEditing(false);

      if (Platform.OS === 'web') {
        showToast.success('Profile updated successfully');
      } else {
        showToast.success('Profile updated successfully');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to update profile');
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderProfilePhoto = () => {
    // Derive base URL from API_BASE_URL (remove /api suffix)
    const apiBaseUrl = config.API_BASE_URL;
    const baseUrl = apiBaseUrl.replace('/api', '');

    return (
      <View style={styles.profilePhotoContainer}>
        {profile?.profilePhotoUrl ? (
          <Image
            source={{ uri: `${baseUrl}${profile.profilePhotoUrl}` }}
            style={styles.profilePhoto}
          />
        ) : (
          <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
            <User size={60} color="#9CA3AF" />
          </View>
        )}
        {editing && (
          <TouchableOpacity style={styles.cameraButton} onPress={handlePickPhoto}>
            <Camera size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderViewMode = () => {
    return (
      <View style={styles.viewContainer}>
        {renderProfilePhoto()}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <User size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {profile?.fullName || 'Not set'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Mail size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Phone size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {profile?.fullPhoneNumber || 'Not set'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>
              {profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : 'Not set'}
            </Text>
          </View>

          {profile?.age && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile.age} years</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {profile?.gender || 'Not set'}
            </Text>
          </View>

          {(profile?.addressLine || profile?.city || profile?.state || profile?.pincode) && (
            <View style={styles.infoRow}>
              <MapPin size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {[profile.addressLine, profile.city, profile.state, profile.pincode]
                  .filter(Boolean)
                  .join(', ') || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(true)}
        >
          <Edit size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditMode = () => {
    return (
      <ScrollView style={styles.formContainer}>
        {renderProfilePhoto()}

        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={true}
          />
          <Text style={styles.hintText}>This email is used as your username for login</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={styles.input}
            value={formData.middleName}
            onChangeText={(text) => setFormData({ ...formData, middleName: text })}
            placeholder="Enter middle name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            placeholder="Enter last name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderOptions}>
            {['MALE', 'FEMALE', 'OTHER'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  formData.gender === gender && styles.genderOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, gender: gender as any })}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    formData.gender === gender && styles.genderOptionTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Country Code *</Text>
            <TextInput
              style={styles.input}
              value={formData.countryCode}
              onChangeText={(text) => setFormData({ ...formData, countryCode: text })}
              placeholder="+91"
            />
          </View>

          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.mobileNumber}
              onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Address Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(text) => setFormData({ ...formData, country: text })}
            placeholder="Enter country"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(text) => setFormData({ ...formData, state: text })}
            placeholder="Enter state"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address Line</Text>
          <TextInput
            style={styles.input}
            value={formData.addressLine}
            onChangeText={(text) => setFormData({ ...formData, addressLine: text })}
            placeholder="Enter address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={styles.input}
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text })}
            placeholder="Enter pincode"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setEditing(false);
              loadProfile(); // Reset form to original values
            }}
          >
            <X size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        navigation={navigation}
        showBackButton={editing}
        showHomeButton={!editing}
        title={editing ? 'Edit Profile' : 'My Profile'}
        showProfileMenu={!editing}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {editing ? renderEditMode() : renderViewMode()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewContainer: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
