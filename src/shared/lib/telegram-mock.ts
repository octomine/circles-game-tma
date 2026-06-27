export function initTelegramMock() {
  if (process.env.NODE_ENV === 'development' && typeof window !== undefined && !window.Telegram) {
    window.Telegram = {
      WebApp: {
        ready: () => console.log('[Mock] WebApp.ready()'),
        expand: () => console.log('[Mock] WebApp.expand()'),
        enableClosingConfirmation: () => {},
        HapticFeedback: {
          impactOccurred: (style: string) => console.log(`[Mock] Haptic: ${style}`),
        },
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'ru',
          },
        },
        themeParams: {
          bg_color: '#ffffff',
          text_color: '#000000',
          button_color: '#3390ec',
          button_text_color: '#ffffff',
        },
      } as any, // TODO: разобраться с типам!!1
    };
  }
}
