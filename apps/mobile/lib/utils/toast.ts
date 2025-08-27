import Toast from 'react-native-toast-message';

export class ToastService {
  static success(message: string, visibilityTime: number = 3000) {
    Toast.show({
      type: 'success',
      text1: 'Başarılı',
      text2: message,
      visibilityTime,
    });
  }

  static error(message: string, visibilityTime: number = 4000) {
    Toast.show({
      type: 'error',
      text1: 'Hata',
      text2: message,
      visibilityTime,
    });
  }

  static info(message: string, visibilityTime: number = 3000) {
    Toast.show({
      type: 'info',
      text1: 'Bilgi',
      text2: message,
      visibilityTime,
    });
  }

  static warning(message: string, visibilityTime: number = 3000) {
    Toast.show({
      type: 'error', 
      text1: 'Uyarı',
      text2: message,
      visibilityTime,
    });
  }

  static hide() {
    Toast.hide();
  }
}

// Error handling utilities
export class ErrorHandler {
  static handleApiError(error: any): string {
    console.error('API Error:', error);
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.errors?.length > 0) {
      return error.response.data.errors[0].message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Beklenmeyen bir hata oluştu';
  }

  static handleSocketError(error: any): string {
    console.error('Socket Error:', error);
    
    if (error.message) {
      return error.message;
    }
    
    return 'Bağlantı hatası oluştu';
  }

  static showError(error: any, fallbackMessage?: string) {
    const message = this.handleApiError(error) || fallbackMessage || 'Bir hata oluştu';
    ToastService.error(message);
  }

  static showSocketError(error: any) {
    const message = this.handleSocketError(error);
    ToastService.error(message);
  }
}
