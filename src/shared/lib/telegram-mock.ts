export const initTelegramMock = () => {
  if (typeof window === 'undefined') return;
  if ((window as any).Telegram?.WebApp) return;

  console.log('🤖 [DEV] Initializing Telegram WebApp Mock...');

  const mockWebApp = {
    ready: () => console.log('[Mock] WebApp.ready()'),
    expand: () => console.log('[Mock] WebApp.expand()'),
    close: () => console.log('[Mock] WebApp.close()'),
    enableClosingConfirmation: () => {},
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'dev_user',
        language_code: 'ru',
      },
    },
    themeParams: {
      bg_color: '#1c1c1e',
      text_color: '#ffffff',
      hint_color: '#8e8e93',
      button_color: '#007aff',
      button_text_color: '#ffffff',
      secondary_bg_color: '#2c2c2e',
    },
    HapticFeedback: {
      impactOccurred: (style: string) => {
        console.log(`[Mock] Haptic: impact ${style}`);
      },
      notificationOccurred: (type: string) => {
        console.log(`[Mock] Haptic: notification ${type}`);
      },
      selectionChanged: () => {
        console.log('[Mock] Haptic: selection changed');
      },
    },
    MainButton: {
      text: 'Continue',
      isVisible: false,
      show: () => {
        mockWebApp.MainButton.isVisible = true;
        console.log('[Mock] MainButton.show()');
      },
      hide: () => {
        mockWebApp.MainButton.isVisible = false;
        console.log('[Mock] MainButton.hide()');
      },
      onClick: (cb: () => void) => {
        console.log('[Mock] MainButton.onClick registered');
      },
    },
    BackButton: {
      isVisible: false,
      show: () => {
        mockWebApp.BackButton.isVisible = true;
        console.log('[Mock] BackButton.show()');
      },
      hide: () => {
        mockWebApp.BackButton.isVisible = false;
        console.log('[Mock] BackButton.hide()');
      },
      onClick: (cb: () => void) => {
        console.log('[Mock] BackButton.onClick registered');
      },
    },
  };

  (window as any).Telegram = { WebApp: mockWebApp };
};
