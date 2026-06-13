export type TgWebApp = NonNullable<Window['Telegram']>['WebApp'];
type TgUser = NonNullable<TgWebApp['initDataUnsafe']['user']>;
type TgTheme = TgWebApp['themeParams'];

export interface ITelegramContext {
  webApp: TgWebApp | null;
  isReady: boolean;
  user: TgUser | null;
  theme: TgTheme | null;
}
