import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';
import { Message, Personality, Thread } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const MESSAGES_COLLECTION = 'messages';
const THREADS_COLLECTION = 'threads';

/**
 * Save a message to Firestore
 */
export async function saveMessage(message: Omit<Message, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

/**
 * Get messages for a thread
 */
export async function getMessages(threadId: string, ownerId: string): Promise<Message[]> {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      where('ownerId', '==', ownerId)
    );
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
      } as Message);
    });
    
    // Sort messages by createdAt on the client side
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string, 
  status: Message['status'], 
  error?: string | null
): Promise<void> {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    // Only include error field if it's not undefined
    if (error !== undefined) {
      updateData.error = error;
    }
    
    await updateDoc(messageRef, updateData);
  } catch (error) {
    console.error('Error updating message status:', error);
    throw new Error('Failed to update message status');
  }
}

/**
 * Update message payload (for transcript, improvement, etc.)
 */
export async function updateMessagePayload(
  messageId: string, 
  payloadUpdates: Partial<Message['payload']>
): Promise<void> {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    
    // Get current message to merge with existing payload
    const currentDoc = await getDoc(messageRef);
    let currentPayload = {};
    
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      currentPayload = currentData.payload || {};
    }
    
    // Merge existing payload with updates
    const mergedPayload = {
      ...currentPayload,
      ...payloadUpdates
    };
    
    await updateDoc(messageRef, {
      payload: mergedPayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating message payload:', error);
    throw new Error('Failed to update message payload');
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
}

/**
 * Save a thread to Firestore
 */
export async function saveThread(thread: Omit<Thread, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, THREADS_COLLECTION), {
      ...thread,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving thread:', error);
    throw new Error('Failed to save thread');
  }
}

/**
 * Get a single thread by ID
 */
export async function getThread(threadId: string): Promise<Thread | null> {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (threadSnap.exists()) {
      const data = threadSnap.data();
      return {
        id: threadSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
      } as Thread;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting thread:', error);
    throw error;
  }
}

/**
 * Get threads for a user
 */
export async function getThreads(ownerId: string): Promise<Thread[]> {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    // Sem filtro: retorna todas as threads (atenção à segurança nas regras do Firestore)
    const q = query(threadsRef);
    const querySnapshot = await getDocs(q);
    const threads: Thread[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      threads.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      } as Thread);
    });
    
    // Sort threads by updatedAt on the client side
    threads.sort((a, b) => b.updatedAt - a.updatedAt);
    
    return threads;
  } catch (error) {
    console.error('Error getting threads:', error);
    throw new Error('Failed to get threads');
  }
}

/**
 * Update thread
 */
export async function updateThread(threadId: string, updates: Partial<Thread>): Promise<void> {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating thread:', error);
    throw new Error('Failed to update thread');
  }
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: string): Promise<void> {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await deleteDoc(threadRef);
  } catch (error) {
    console.error('Error deleting thread:', error);
    throw new Error('Failed to delete thread');
  }
}

/**
 * Subscribe to real-time updates for messages in a thread
 */
export function subscribeToMessages(
  threadId: string, 
  deviceId: string, 
  onUpdate: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where('threadId', '==', threadId),
    where('deviceId', '==', deviceId)
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
      } as Message);
    });
    
    // Sort messages by creation time
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    onUpdate(messages);
  }, (error) => {
    console.error('Error in realtime subscription:', error);
  });
  
  return unsubscribe;
}

// Personality functions
export const savePersonality = async (personality: Omit<Personality, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const personalityData = {
      ...personality,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, 'personalities'), personalityData);
    console.log('Personality saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving personality:', error);
    throw error;
  }
};

export const updatePersonality = async (id: string, updates: Partial<Personality>): Promise<void> => {
  try {
    const personalityRef = doc(db, 'personalities', id);
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };
    
    await updateDoc(personalityRef, updateData);
    console.log('Personality updated:', id);
  } catch (error) {
    console.error('Error updating personality:', error);
    throw error;
  }
};

export const deletePersonality = async (id: string): Promise<void> => {
  try {
    const personalityRef = doc(db, 'personalities', id);
    await deleteDoc(personalityRef);
    console.log('Personality deleted:', id);
  } catch (error) {
    console.error('Error deleting personality:', error);
    throw error;
  }
};

export const getPersonalities = async (): Promise<Personality[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'personalities'));
    const personalities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Personality[];
    
    console.log('Fetched personalities:', personalities.length);
    return personalities;
  } catch (error) {
    console.error('Error fetching personalities:', error);
    throw error;
  }
};
