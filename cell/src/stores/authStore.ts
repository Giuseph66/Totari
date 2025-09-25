import * as SecureStore from 'expo-secure-store';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { create } from 'zustand';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define user type matching Firestore structure
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: any; // Firestore timestamp
  lastLoginAt: any; // Firestore timestamp
}

// Define the store state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// Create the store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    try {
      // Query Firestore for user with matching email and password
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid email or password');
      }
      
      // Get the first matching user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update lastLoginAt
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLoginAt: serverTimestamp()
      });
      
      const user: User = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        createdAt: userData.createdAt,
        lastLoginAt: serverTimestamp()
      };
      
      // Store user in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  },
  
  register: async (email, password, displayName) => {
    try {
      // Check if user already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('User already exists');
      }
      
      // Create new user in Firestore
      const userData = {
        email,
        name: displayName,
        password,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      const docRef = await addDoc(usersRef, userData);
      
      const user: User = {
        id: docRef.id,
        email,
        name: displayName,
        password,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      };
      
      // Store user in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },
  
  logout: async () => {
    try {
      // Clear user from secure storage
      await SecureStore.deleteItemAsync('user');
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },
  
  initializeAuth: async () => {
    console.log('Starting auth initialization...');
    
    try {
      // Verificar se o SecureStore está disponível
      const isAvailable = await SecureStore.isAvailableAsync();
      console.log('SecureStore available:', isAvailable);
      
      if (!isAvailable) {
        console.log('SecureStore not available, setting as not authenticated');
        set({ user: null, isAuthenticated: false });
        return;
      }
      
      // Try to get existing user from secure storage
      const userJson = await SecureStore.getItemAsync('user');
      console.log('User JSON from storage:', userJson ? 'exists' : 'null');
      
      if (userJson && userJson.trim() !== '') {
        try {
          const user = JSON.parse(userJson);
          console.log('Parsed user:', user.email);
          
          // Validar se o usuário tem os campos necessários
          if (user.email && user.name) {
            set({ user, isAuthenticated: true });
            console.log('User authenticated successfully');
          } else {
            console.log('Invalid user data, clearing storage');
            await SecureStore.deleteItemAsync('user');
            set({ user: null, isAuthenticated: false });
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          // Limpar dados corrompidos
          await SecureStore.deleteItemAsync('user');
          set({ user: null, isAuthenticated: false });
        }
      } else {
        console.log('No user found in storage');
        set({ user: null, isAuthenticated: false });
      }
      
      console.log('Auth initialization completed successfully');
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Em caso de erro, definir como não autenticado
      set({ user: null, isAuthenticated: false });
    }
  },
}));