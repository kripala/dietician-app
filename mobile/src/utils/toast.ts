import Toast from 'react-native-toast-message';

export const showToast = {
  success: (message: string, title: string = 'Success') => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      props: {
        closeButton: true,
      },
    });
  },

  error: (message: string, title: string = 'Error') => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      props: {
        closeButton: true,
      },
    });
  },

  info: (message: string, title: string = 'Info') => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      props: {
        closeButton: true,
      },
    });
  },

  warning: (message: string, title: string = 'Warning') => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      props: {
        closeButton: true,
      },
    });
  },
};

export default Toast;
