// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock authApi
jest.mock('../../src/api/client', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
  },
}));

import { useAuthStore } from '../../src/stores/authStore';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../../src/api/client';

describe('authStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store to initial state
    const { getState, setState } = useAuthStore;
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      login: getState().login,
      register: getState().register,
      logout: getState().logout,
      initializeAuth: getState().initializeAuth,
      refreshUser: getState().refreshUser,
    });
  });

  test('login updates state on success', async () => {
    // Mock successful login response
    const mockResponse = {
      token: 'test-token',
      user: { id: '1', email: 'test@example.com', displayName: 'Test User', createdAt: Date.now() },
    };
    
    (authApi.login as jest.Mock).mockResolvedValue(mockResponse);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    
    // Perform login
    await useAuthStore.getState().login('test@example.com', 'password123');
    
    // Check state updates
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token');
    expect(state.user).toEqual(mockResponse.user);
    
    // Check that token was saved
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'test-token');
  });

  test('logout clears state and token', async () => {
    // Set initial state
    const { setState } = useAuthStore;
    setState({
      ...useAuthStore.getState(),
      user: { id: '1', email: 'test@example.com', displayName: 'Test User', createdAt: Date.now() },
      token: 'test-token',
      isAuthenticated: true,
    });
    
    // Mock deleteItemAsync
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    
    // Perform logout
    await useAuthStore.getState().logout();
    
    // Check state updates
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.user).toBe(null);
    
    // Check that token was deleted
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
  });
});