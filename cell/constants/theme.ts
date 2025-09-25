/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Message bubble colors
    audioBubble: '#e3f2fd',
    audioBubbleBorder: '#bbdefb',
    transcriptBubble: '#f5f5f5',
    transcriptBubbleBorder: '#e0e0e0',
    improvementBubble: '#e8f5e9',
    improvementBubbleBorder: '#c8e6c9',
    defaultBubble: '#fafafa',
    defaultBubbleBorder: '#eeeeee',
    // Auth screen colors
    authBackground: '#f5f5f5',
    authCardBackground: '#fff',
    inputBackground: '#fff',
    inputBorder: '#ddd',
    inputError: '#ff4444',
    buttonBackground: '#2196F3',
    buttonDisabled: '#BBDEFB',
    buttonConfirm: '#4CAF50',
    buttonText: '#fff',
    linkColor: '#2196F3',
    // Thread screen colors
    threadBackground: '#f5f5f5',
    threadCardBackground: '#fff',
    threadCardShadow: '#000',
    threadHeaderBackground: '#fff',
    threadHeaderBorder: '#e0e0e0',
    // Chat screen colors
    chatBackground: '#f5f5f5',
    chatHeaderBackground: '#fff',
    chatHeaderBorder: '#e0e0e0',
    // Status colors
    statusRecording: '#ff5722',
    statusTranscribing: '#ff9800',
    statusTranscribed: '#4caf50',
    statusError: '#f44336',
    // Additional colors
    cardBackground: '#fff',
    border: '#e0e0e0',
    textSecondary: '#666666',
    warning: '#ff9800',
    error: '#f44336',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Message bubble colors for dark mode
    audioBubble: '#1e3a5f',
    audioBubbleBorder: '#2d4b73',
    transcriptBubble: '#2d2d2d',
    transcriptBubbleBorder: '#444444',
    improvementBubble: '#1e4d2b',
    improvementBubbleBorder: '#2d6b3d',
    defaultBubble: '#252525',
    defaultBubbleBorder: '#3d3d3d',
    // Auth screen colors
    authBackground: '#1a1a1a',
    authCardBackground: '#2d2d2d',
    inputBackground: '#3d3d3d',
    inputBorder: '#555555',
    inputError: '#ff6b6b',
    buttonBackground: '#1976d2',
    buttonDisabled: '#424242',
    buttonConfirm: '#4CAF50',
    buttonText: '#fff',
    linkColor: '#64b5f6',
    // Thread screen colors
    threadBackground: '#1a1a1a',
    threadCardBackground: '#2d2d2d',
    threadCardShadow: '#000',
    threadHeaderBackground: '#2d2d2d',
    threadHeaderBorder: '#444444',
    // Chat screen colors
    chatBackground: '#1a1a1a',
    chatHeaderBackground: '#2d2d2d',
    chatHeaderBorder: '#444444',
    // Status colors
    statusRecording: '#ff7043',
    statusTranscribing: '#ffb74d',
    statusTranscribed: '#66bb6a',
    statusError: '#ef5350',
    // Additional colors
    cardBackground: '#2d2d2d',
    border: '#444444',
    textSecondary: '#9BA1A6',
    warning: '#ffb74d',
    error: '#ef5350',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});