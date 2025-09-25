// Utility functions for error handling and validation
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';

// Constants for audio validation
export const MAX_AUDIO_DURATION = 20 * 60; // 20 minutes in seconds
export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25 MB in bytes

// Format time in seconds to MM:SS format
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
};

// Format date to full date string
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return false;
  }
};

// Validate audio file size (max 25MB)
export const validateAudioFileSize = async (uri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && typeof fileInfo.size === 'number') {
      return fileInfo.size <= MAX_AUDIO_FILE_SIZE;
    }
    return false;
  } catch (error) {
    console.error('Error validating audio file size:', error);
    return false;
  }
};

// Validate audio duration (max 20 minutes)
export const validateAudioDuration = (duration: number): boolean => {
  return duration <= MAX_AUDIO_DURATION;
};

// Format file size in bytes to human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Exponential backoff retry function
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};