import toast, { ToastOptions } from "react-hot-toast";

const defaultOptions: ToastOptions = {
  duration: 4000,
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
  },
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    ...defaultOptions,
    iconTheme: {
      primary: '#10B981', // Green-500
      secondary: '#fff',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    ...defaultOptions,
    iconTheme: {
      primary: '#EF4444', // Red-500
      secondary: '#fff',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, defaultOptions);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const showInfo = (message: string) => {
  toast(message, {
    ...defaultOptions,
    icon: '💡',
    style: {
      background: '#3B82F6', // Blue-500
      color: '#fff',
    },
  });
};