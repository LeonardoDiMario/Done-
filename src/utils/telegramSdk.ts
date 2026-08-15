import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: number;
          hash?: string;
        };
        version?: string;
        platform?: string;
        colorScheme?: 'light' | 'dark';
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        sendData: (data: string) => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
};

export const getTelegramUser = (): TelegramUser => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return {
    id: 6459885823,
    first_name: 'Kyaw',
    last_name: 'Zin',
    username: 'tele_roleplayer',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  };
};

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  }
};

export const triggerHapticNotification = (type: 'success' | 'warning' | 'error') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
};

export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
};
