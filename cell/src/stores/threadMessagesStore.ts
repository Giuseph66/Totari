import { create } from 'zustand';
import { deleteThread, getThreads, saveThread, updateThread } from '../api/firestore';
import { getOrCreateDeviceId } from '../utils/deviceId';

// Import Thread type from types
import { Thread } from '../types';

interface ThreadMessagesState {
  threads: Thread[];
  currentThread: Thread | null;
  loading: boolean;
  error: string | null;
  
  // Thread actions
  fetchThreads: () => Promise<void>;
  createThread: (title: string) => Promise<Thread>;
  setCurrentThread: (thread: Thread | null) => void;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<void>;
}

export const useThreadMessagesStore = create<ThreadMessagesState>((set, get) => ({
  threads: [],
  currentThread: null,
  loading: false,
  error: null,
  
  fetchThreads: async () => {
    set({ loading: true, error: null });
    try {
      const deviceId = await getOrCreateDeviceId();
      const threads = await getThreads(deviceId);
      set({ threads, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch threads',
        loading: false 
      });
    }
  },
  
  createThread: async (title: string) => {
    try {
      const deviceId = await getOrCreateDeviceId();
      const newThread: Omit<Thread, 'id'> = {
        ownerId: deviceId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const threadId = await saveThread(newThread);
      const createdThread: Thread = { ...newThread, id: threadId };
      
      // Update threads in state
      set(state => ({
        threads: [...state.threads, createdThread]
      }));
      
      return createdThread;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to create thread');
    }
  },
  
  setCurrentThread: (thread) => {
    set({ currentThread: thread });
  },
  
  deleteThread: async (threadId: string) => {
    try {
      await deleteThread(threadId);
      
      set(state => ({
        threads: state.threads.filter(thread => thread.id !== threadId)
      }));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to delete thread');
    }
  },
  
  updateThreadTitle: async (threadId: string, newTitle: string) => {
    try {
      await updateThread(threadId, { 
        title: newTitle, 
        updatedAt: Date.now() 
      });
      
      set(state => ({
        threads: state.threads.map(thread => 
          thread.id === threadId 
            ? { ...thread, title: newTitle, updatedAt: Date.now() }
            : thread
        )
      }));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to update thread title');
    }
  }
}));