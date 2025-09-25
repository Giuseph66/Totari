import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, uploadString, getDownloadURL, listAll } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 * @param path The storage path
 * @param file The file to upload
 * @returns Upload task
 */
export function uploadFile(path: string, file: Blob) {
  const storageRef = ref(storage, path);
  return uploadBytesResumable(storageRef, file);
}

/**
 * Upload a string to Firebase Storage
 * @param path The storage path
 * @param data The string data to upload
 * @param format The format of the data ('raw', 'base64', 'base64url', 'data_url')
 * @param contentType The content type
 * @returns Promise that resolves when upload is complete
 */
export function uploadStringData(
  path: string, 
  data: string, 
  format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
  contentType: string = 'application/json'
) {
  const storageRef = ref(storage, path);
  return uploadString(storageRef, data, format, { contentType });
}

/**
 * Get download URL for a file
 * @param path The storage path
 * @returns Promise that resolves with the download URL
 */
export function getFileDownloadURL(path: string) {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * List all items in a directory
 * @param path The storage path
 * @returns Promise that resolves with the list of items
 */
export function listDirectoryItems(path: string) {
  const storageRef = ref(storage, path);
  return listAll(storageRef);
}

/**
 * Get storage reference
 * @param path The storage path
 * @returns Storage reference
 */
export function getStorageReference(path: string) {
  return ref(storage, path);
}

export { storage };