import { getMessages, getThread, subscribeToMessages } from '@/src/api/firestore';
import { MessageBubble } from '@/src/components/MessageBubble';
import { PersonalityDrawer } from '@/src/components/PersonalityDrawer';
import { Recorder } from '@/src/components/Recorder';
import { getOrCreateDeviceId } from '@/src/utils/deviceId';
import { copyToClipboard } from '@/src/utils/helpers';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';

import { Colors } from '@/constants/theme';
import { usePersonalityStore } from '@/src/stores/personalityStore';
import { Message } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';

export default function ChatThreadScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showPersonalityDrawer, setShowPersonalityDrawer] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const router = useRouter();
  const { id: threadId, threadTitle: threadTitleParam } = useLocalSearchParams();
  const [threadTitle, setThreadTitle] = useState(
    Array.isArray(threadTitleParam) ? threadTitleParam[0] : threadTitleParam || 'conversa'
  );
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { selectedPersonality, selectPersonality } = usePersonalityStore();

  // Build conversation history for AI context
  const getConversationHistory = (): string[] => {
    return messages
      .filter(msg => msg.kind === 'transcript' || msg.kind === 'note')
      .slice(-10) // Last 10 messages for context
      .map(msg => {
        if (msg.kind === 'transcript') {
          return `Usuário: ${msg.payload.transcript?.text || ''}`;
        } else if (msg.kind === 'note') {
          return `${selectedPersonality?.name || 'IA'}: ${msg.payload.note?.text || ''}`;
        }
        return '';
      })
      .filter(text => text.trim());
  };

  useEffect(() => {
    if (threadId) {
      // Load initial messages first
      loadMessages();
      // Then start realtime subscription for updates
      startRealtimeSubscription();
      // Load thread title
      loadThreadTitle();

     
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [threadId]);

  // Update thread title when threadTitleParam changes
  useEffect(() => {
    const newTitle = Array.isArray(threadTitleParam) ? threadTitleParam[0] : threadTitleParam;
    if (newTitle && newTitle !== threadTitle) {
      setThreadTitle(newTitle);
    }
  }, [threadTitleParam, threadTitle]);

  // Cleanup subscription when component unmounts
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const startRealtimeSubscription = async () => {
    try {
      // Clear any existing subscription
      if (unsubscribe) {
        console.log('Clearing existing subscription');
        unsubscribe();
        setUnsubscribe(null);
      }
      
      const deviceId = await getOrCreateDeviceId();
      
      // Start realtime subscription
      console.log('Starting realtime subscription for thread:', threadId);
      const unsubscribeFn = subscribeToMessages(
        threadId as string, 
        deviceId, 
        (realtimeMessages) => {
          console.log('Realtime update - messages:', realtimeMessages.length);
          // Update messages with realtime data (both new and updated messages)
          if (realtimeMessages.length > 0) {
            setMessages(prevMessages => {
              // Create a map of existing messages for quick lookup
              const existingMessagesMap = new Map(prevMessages.map(msg => [msg.id, msg]));
              
              // Process realtime messages
              realtimeMessages.forEach(realtimeMsg => {
                existingMessagesMap.set(realtimeMsg.id, realtimeMsg);
              });
              
              // Convert back to array and sort
              const updatedMessages = Array.from(existingMessagesMap.values())
                .sort((a, b) => a.createdAt - b.createdAt);
              
              console.log('Updated messages from realtime:', updatedMessages.length);
              
              // Scroll to bottom if new messages were added
              if (updatedMessages.length > prevMessages.length) {
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
              
              return updatedMessages;
            });
          }
        }
      );
      console.log('Realtime subscription started');
      
      setUnsubscribe(() => unsubscribeFn);
    } catch (error) {
      console.error('Error starting realtime subscription:', error);
      Alert.alert('Erro', 'Falha ao conectar em tempo real');
    }
  };

  const loadMessages = async () => {
    try {
      console.log('Loading messages for thread:', threadId);
      const deviceId = await getOrCreateDeviceId();
      console.log('Device ID:', deviceId);
      const messages = await getMessages(threadId as string, deviceId);
      setMessages(messages);
      console.log('Loaded messages:', messages.length);
      
      // Scroll to bottom after loading messages
      if (messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Erro', 'Falha ao carregar mensagens');
    }
  };

  const loadThreadTitle = async () => {
    try {
      if (threadId && (!threadTitleParam || threadTitle === 'conversa')) {
        const thread = await getThread(threadId as string);
        if (thread && thread.title) {
          setThreadTitle(thread.title);
        }
      }
    } catch (error) {
      console.error('Error loading thread title:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Load fresh messages from database
    await loadMessages();
    // Restart realtime subscription for updates
    await startRealtimeSubscription();
    setRefreshing(false);
  };

  const handleRecordingComplete = (message: Message) => {
    // A new recording was completed, add it to the messages list
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message];
    });
    
    // Scroll to bottom after adding new message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Close the modal after recording
    setShowRecorder(false);
  };

  const handleMessageUpdate = (messageId: string, updatedMessage: Message) => {
    console.log('handleMessageUpdate called:', {
      messageId,
      messageKind: updatedMessage.kind,
      messageText: updatedMessage.kind === 'note' ? updatedMessage.payload.note?.text : 'N/A',
      currentMessagesCount: messages.length
    });
    
    // Update existing message in the list or add new message
    setMessages(prev => {
      const existingIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingIndex !== -1) {
        console.log('Updating existing message at index:', existingIndex);
        // Update existing message
        return prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        );
      } else {
        console.log('Adding new message to list');
        // Add new message
        return [...prev, updatedMessage];
      }
    });
    
    // Scroll to bottom when new message is added
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };


  const handleCopyText = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('✅ Texto copiado!', ToastAndroid.SHORT);
      } else {
        Alert.alert('✅ Copiado!', 'Texto copiado para a área de transferência');
      }
    } else {
        Alert.alert('❌ Erro', 'Falha ao copiar texto');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
    scrollToBottom();
      }, 100);
    }
  }, [messages]);

  return (
    <View style={[styles.container, { backgroundColor: colors.chatBackground }]}>
      <View style={[styles.header, { backgroundColor: colors.chatHeaderBackground, borderBottomColor: colors.chatHeaderBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={() => setShowPersonalityDrawer(true)}
        >
          <View style={[styles.personalityIcon, { backgroundColor: selectedPersonality?.color || '#4ECDC4' }]}>
            <Ionicons name={selectedPersonality?.icon as any || 'person'} size={20} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {threadTitle}
        </Text>
            <View style={styles.personalityInfo}>
              <Text style={[styles.personalityName, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedPersonality?.name || 'IA Personalizada'}
              </Text>
              <Text style={[styles.personalityRole, { color: colors.icon }]} numberOfLines={1}>
                {selectedPersonality?.role || 'Assistente'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusIndicator, { backgroundColor: selectedPersonality?.color || '#4ECDC4' }]} />
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Personality Context Bar */}
      {selectedPersonality && (
        <View style={[styles.personalityContext, { backgroundColor: selectedPersonality.color + '15', borderBottomColor: selectedPersonality.color + '30' }]}>
          <View style={styles.contextContent}>
            <View style={[styles.contextIcon, { backgroundColor: selectedPersonality.color }]}>
              <Ionicons name={selectedPersonality.icon as any} size={16} color="white" />
            </View>
            <View style={styles.contextText}>
              <Text style={[styles.contextDescription, { color: colors.text }]} numberOfLines={2}>
                {selectedPersonality.description}
              </Text>
              <Text style={[styles.contextRules, { color: colors.textSecondary }]}>
                {selectedPersonality.rules.length} regras ativas
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.contextButton, { backgroundColor: selectedPersonality.color }]}
              onPress={() => setShowPersonalityDrawer(true)}
            >
              <Ionicons name="settings-outline" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.messagesContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Message }) => (
          <MessageBubble 
            message={item} 
            onCopyText={handleCopyText}
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      </View>
      
      <View style={styles.fab}>
        <Recorder 
          threadId={threadId as string} 
          onRecordingComplete={handleRecordingComplete} 
          onMessageUpdate={handleMessageUpdate}
          personality={selectedPersonality}
          conversationHistory={getConversationHistory()}
        />
      </View>

      {/* Personality Drawer */}
      <PersonalityDrawer
        visible={showPersonalityDrawer}
        onClose={() => setShowPersonalityDrawer(false)}
        onSelectPersonality={selectPersonality}
        selectedPersonality={selectedPersonality}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 16,
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personalityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  personalityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personalityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  personalityRole: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personalityContext: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextText: {
    flex: 1,
  },
  contextDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  contextRules: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  contextButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 16,
    paddingBottom: 80, // Espaço para o FAB
  },
  fab: {
    position: 'absolute',
    right: 40,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  recorderContainer: {
    width: '100%',
    marginTop: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});