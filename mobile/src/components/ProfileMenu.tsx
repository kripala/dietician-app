import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { User as UserIcon, Lock, LogOut, ChevronDown } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface ProfileMenuProps {
  navigation?: NativeStackNavigationProp<any>;
  onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ navigation, onLogout }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const { width: screenWidth } = Dimensions.get('window');
  const menuWidth = 200;

  const toggleMenu = () => {
    if (!menuVisible) {
      // Show menu
      if (buttonRef.current && Platform.OS === 'web') {
        buttonRef.current.measureInWindow((x, y, width, height) => {
          setMenuPosition({
            x: Math.min(x + width - menuWidth, screenWidth - menuWidth - 10),
            y: y + height + 8,
          });
        });
      }
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide menu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMenuVisible(false);
      });
    }
  };

  const handleMenuPress = (screen: string) => {
    toggleMenu();
    navigation?.navigate(screen);
  };

  const handleLogout = () => {
    toggleMenu();
    onLogout();
  };

  const menuItems = [
    {
      icon: UserIcon,
      label: 'Edit Profile',
      onPress: () => handleMenuPress('UserProfile'),
      color: '#4F46E5',
    },
    {
      icon: Lock,
      label: 'Reset Password',
      onPress: () => handleMenuPress('ResetPassword'),
      color: '#059669',
    },
  ];

  return (
    <View ref={buttonRef} style={styles.container}>
      <TouchableOpacity
        onPress={toggleMenu}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <UserIcon size={24} color="#4F46E5" />
        <ChevronDown size={16} color="#4F46E5" style={styles.chevron} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                left: Platform.OS === 'web' ? menuPosition.x : screenWidth - menuWidth - 20,
                top: Platform.OS === 'web' ? menuPosition.y : 60,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <item.icon size={18} color={item.color} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={18} color="#FF4B4B" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 4,
  },
  chevron: {
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 4,
  },
});

export default ProfileMenu;
