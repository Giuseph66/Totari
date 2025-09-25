import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'totari_device_id';

/**
 * Generate a simple UUID-like string
 */
function generateSimpleId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate and persist a local device ID
 * @returns The device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    // If no device ID exists, create a new one
    if (!deviceId) {
      deviceId = generateSimpleId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting or creating device ID:', error);
    throw new Error('Failed to get or create device ID');
  }
}

/**
 * Clear the device ID (useful for logout/reset)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
}