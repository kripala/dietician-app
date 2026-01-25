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
  Modal,
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
  LogOut,
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
  const { user, updateProfilePictureUrl, updateUserEmail, updateAuthTokens, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Email change verification state
  const [emailChangeModalVisible, setEmailChangeModalVisible] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  // OAuth email change confirmation state
  const [oauthConfirmModalVisible, setOAuthConfirmModalVisible] = useState(false);
  const [oauthUpdating, setOAuthUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Reset image error when profile picture URL changes
  useEffect(() => {
    setImageError(false);
  }, [profile?.profilePhotoUrl]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await profileService.getProfile(user.id);
      setProfile(data);
      setIsOAuthUser(data.isOAuthUser || false);

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
        const asset = result.assets[0];

        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          const fileSizeMB = (asset.fileSize / (1024 * 1024)).toFixed(2);
          showToast.error(`File size is ${fileSizeMB} MB. Must be below 5 MB.`);
          return;
        }

        uploadPhoto(asset.uri);
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

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    if (file.size > MAX_FILE_SIZE) {
      showToast.error(`File size is ${fileSizeMB} MB. Must be below 5 MB.`);
      return;
    }

    try {
      setSaving(true);
      const response = await profileService.uploadPhoto(user.id, file);
      // Update profile picture URL in auth context immediately
      updateProfilePictureUrl(response.profilePhotoUrl);
      await loadProfile();
      showToast.success('Profile photo updated successfully');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to upload photo');
      // Check if error is about file size
      if (errorMessage.includes('size') || errorMessage.includes('large')) {
        showToast.error(`File size is ${fileSizeMB} MB. Must be below 5 MB.`);
      } else {
        showToast.error(errorMessage);
      }
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
      showToast.success('Profile photo updated successfully');
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
      showToast.error('First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      showToast.error('Last name is required');
      return;
    }

    if (!formData.dateOfBirth) {
      showToast.error('Date of birth is required');
      return;
    }

    if (!formData.gender) {
      showToast.error('Gender is required');
      return;
    }

    if (!formData.mobileNumber.trim()) {
      showToast.error('Mobile number is required');
      return;
    }

    // Check if email changed and not empty
    const originalEmail = user?.email || '';
    const newEmail = formData.email || '';

    if (newEmail && newEmail !== originalEmail && newEmail.trim() !== '') {
      // Email changed - show appropriate dialog based on user type
      setPendingEmail(newEmail);
      if (isOAuthUser) {
        // OAuth user - show logout warning modal
        setEmailChangeModalVisible(false);
        setOAuthConfirmModalVisible(true);
      } else {
        // Regular user - show OTP verification modal
        setEmailChangeModalVisible(true);
      }
      return;
    }

    // No email change - proceed with normal save
    await saveProfile();
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      Keyboard.dismiss();

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
      const originalEmail = user?.email || '';
      if (newEmail && newEmail !== originalEmail && response?.emailChanged && response?.accessToken && response?.refreshToken) {
        await updateAuthTokens(newEmail, response.accessToken, response.refreshToken);
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

  // ============================================
  // Email Change Verification Handlers
  // ============================================

  const handleSendEmailChangeOtp = async () => {
    if (!user) return;

    try {
      setOtpSending(true);
      const response = await profileService.sendEmailChangeVerification(user.id, pendingEmail);

      // Check if user is OAuth user
      if (response.message?.includes('OAuth') || response.message?.includes('Google')) {
        setEmailChangeModalVisible(false);
        showToast.error(response.message || 'OAuth users must use Google Sign-In to change email');
        return;
      }

      // Show OTP input modal
      setEmailChangeModalVisible(false);
      setOtpModalVisible(true);
      setOtpCode('');
      showToast.success(response.message || 'Verification code sent!');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to send verification code');
      showToast.error(errorMessage);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!user || !otpCode || otpCode.length !== 6) {
      showToast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setOtpVerifying(true);
      const response = await profileService.confirmEmailChange(user.id, pendingEmail, otpCode);

      // Update auth tokens with new email
      await updateAuthTokens(pendingEmail, response.accessToken, response.refreshToken);

      // Update form data with new email
      setFormData({ ...formData, email: pendingEmail });

      // Save the rest of the profile
      setOtpModalVisible(false);
      await saveProfile();

      showToast.success('Email updated successfully!');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to verify email');
      showToast.error(errorMessage);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!user) return;

    try {
      setOtpResending(true);
      const response = await profileService.resendEmailChangeOtp(user.id, pendingEmail);
      showToast.success(response.message || 'New code sent!');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Failed to resend code');
      showToast.error(errorMessage);
    } finally {
      setOtpResending(false);
    }
  };

  // ============================================
  // OAuth Email Change Handler
  // ============================================

  const handleOAuthEmailChange = async () => {
    if (!user) return;

    try {
      setOAuthUpdating(true);
      const response = await profileService.updateEmailForOAuthUser(user.id, pendingEmail);

      // Check if backend returned forceLogout flag
      if (response.forceLogout) {
        setOAuthConfirmModalVisible(false);
        setEditing(false);

        // Show logout message
        showToast.success('Email updated. You will be logged out...');

        // Delay slightly for user to see the message, then logout
        setTimeout(async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 1500);
      }
    } catch (error: any) {
      // Handle auth errors specifically - session expired
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setOAuthConfirmModalVisible(false);
        showToast.error('Your session expired. Please sign in again.');
        setTimeout(async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 1000);
      } else {
        const errorMessage = getErrorMessage(error, 'Failed to update email');
        showToast.error(errorMessage);
      }
    } finally {
      setOAuthUpdating(false);
    }
  };

  const renderEmailChangeModal = () => {
    return (
      <Modal
        visible={emailChangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailChangeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Mail size={24} color="#6B7280" />
              <Text style={styles.modalTitle}>Email Change Verification</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                A verification code will be sent to:
              </Text>
              <Text style={styles.modalEmail}>{pendingEmail}</Text>
              <Text style={styles.modalWarning}>
                Your login email will change to this address after verification.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEmailChangeModalVisible(false)}
                disabled={otpSending}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSendEmailChangeOtp}
                disabled={otpSending}
              >
                {otpSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOtpModal = () => {
    return (
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Mail size={24} color="#6B7280" />
              <Text style={styles.modalTitle}>Enter Verification Code</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                Enter the 6-digit code sent to:
              </Text>
              <Text style={styles.modalEmail}>{pendingEmail}</Text>

              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={otpResending}
                style={styles.resendLink}
              >
                {otpResending ? (
                  <Text style={styles.resendLinkTextDisabled}>Sending...</Text>
                ) : (
                  <Text style={styles.resendLinkText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setOtpModalVisible(false)}
                disabled={otpVerifying}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleVerifyEmailChange}
                disabled={otpVerifying || otpCode.length !== 6}
              >
                {otpVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOAuthConfirmModal = () => {
    return (
      <Modal
        visible={oauthConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOAuthConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <LogOut size={24} color="#F59E0B" />
              <Text style={styles.modalTitle}>Sign Out Required</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                You are signed in with Google. After changing your email:
              </Text>

              <View style={styles.oauthWarningBox}>
                <LogOut size={20} color="#F59E0B" />
                <Text style={styles.oauthWarningText}>
                  You will be signed out of this app
                </Text>
              </View>

              <Text style={styles.modalMessage}>
                Please sign in with your new Google account to continue.
              </Text>
              <Text style={styles.modalEmail}>{pendingEmail}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setOAuthConfirmModalVisible(false)}
                disabled={oauthUpdating}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleOAuthEmailChange}
                disabled={oauthUpdating}
              >
                {oauthUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderProfilePhoto = () => {
    // Derive base URL from API_BASE_URL (remove /api suffix)
    const apiBaseUrl = config.API_BASE_URL;
    const baseUrl = apiBaseUrl.replace('/api', '');

    // Add cache-busting timestamp to profile photo URL to prevent stale cached images
    // For external URLs (like Google profile pictures), use the URL directly
    let photoUrl = null;
    if (profile?.profilePhotoUrl) {
      if (profile.profilePhotoUrl.startsWith('http://') || profile.profilePhotoUrl.startsWith('https://')) {
        // External URL (Google, etc.) - use directly with cache-busting
        photoUrl = `${profile.profilePhotoUrl}?t=${Date.now()}`;
      } else {
        // Internal URL - prepend base URL
        photoUrl = `${baseUrl}${profile.profilePhotoUrl}?t=${Date.now()}`;
      }
    }

    return (
      <View style={styles.profilePhotoContainer}>
        {photoUrl && !imageError ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.profilePhoto}
            onError={() => setImageError(true)}
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

      {/* Email Change Verification Modals */}
      {renderEmailChangeModal()}
      {renderOtpModal()}
      {renderOAuthConfirmModal()}
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

  // ============================================
  // Modal Styles
  // ============================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 13,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
  },
  oauthWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  oauthWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  otpInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  resendLink: {
    marginTop: 8,
  },
  resendLinkText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  resendLinkTextDisabled: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonPrimary: {
    backgroundColor: '#4F46E5',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
