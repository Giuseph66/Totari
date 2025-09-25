import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThreadMessagesStore } from '@/src/stores/threadMessagesStore';
import { Thread } from '@/src/types';
import { formatRelativeTime } from '@/src/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ThreadsScreen() {
  const [loading, setLoading] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const router = useRouter();
  const { threads, fetchThreads, createThread, deleteThread, updateThreadTitle } = useThreadMessagesStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    try {
      await fetchThreads();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async () => {
    try {
      // Create a new thread with a default title
      const newThread = await createThread(`Nova Conversa ${new Date().toLocaleDateString()}`);
      // Navigate to the chat screen for this new thread
      router.push(`/chat/${newThread.id}?threadTitleParam=${encodeURIComponent(newThread.title)}`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conversa');
    }
  };

  const handleLongPress = (thread: Thread) => {
    setSelectedThread(thread);
    setShowOptionsModal(true);
  };

  const handleRename = () => {
    if (selectedThread) {
      setNewTitle(selectedThread.title);
      setShowOptionsModal(false);
      setShowRenameModal(true);
    }
  };

  const handleDelete = () => {
    if (selectedThread) {
      Alert.alert(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir a conversa "${selectedThread.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteThread(selectedThread.id);
                setShowOptionsModal(false);
                setSelectedThread(null);
              } catch (error) {
                Alert.alert('Erro', 'Falha ao excluir conversa');
              }
            }
          }
        ]
      );
    }
  };

  const handleRenameConfirm = async () => {
    if (selectedThread && newTitle.trim()) {
      try {
        await updateThreadTitle(selectedThread.id, newTitle.trim());
        setShowRenameModal(false);
        setSelectedThread(null);
        setNewTitle('');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao renomear conversa');
      }
    }
  };

  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setSelectedThread(null);
    setNewTitle('');
  };


  const renderThreadItem = ({ item }: { item: Thread }) => (
    <TouchableOpacity 
      style={[styles.threadItem, { backgroundColor: colors.threadCardBackground }]}
      onPress={() => router.push(
        `/chat/${item.id}?threadTitleParam=${encodeURIComponent(item.title)}`
      )}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.threadHeader}>
        <Text style={[styles.threadTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.threadDate, { color: colors.icon }]}>{formatRelativeTime(item.updatedAt)}</Text>
      </View>
      <Text style={[styles.threadPreview, { color: colors.icon }]}>Toque para ver a conversa</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.threadBackground }]}>
      <View style={[styles.header, { backgroundColor: colors.threadHeaderBackground, borderBottomColor: colors.threadHeaderBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Suas Conversas</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Carregando conversas...</Text>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Nenhuma conversa ainda</Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>Crie sua primeira conversa para começar</Text>
        </View>
      ) : (
        <View style={styles.threadsContainer}>
          <FlatList
            data={threads}
            keyExtractor={(item) => item.id}
            renderItem={renderThreadItem}
            refreshing={loading}
            onRefresh={loadThreads}
          />
        </View>
      )}
      
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.buttonBackground }]} onPress={handleCreateThread}>
        <Text style={[styles.fabText, { color: colors.buttonText }]}>+</Text>
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.optionsModal, { backgroundColor: colors.threadCardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Opções da Conversa</Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              {selectedThread?.title}
            </Text>
            
            <TouchableOpacity 
              style={[styles.optionButton, { borderBottomColor: colors.threadHeaderBorder }]}
              onPress={handleRename}
            >
              <Ionicons name="pencil" size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Renomear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#f44336" />
              <Text style={[styles.optionText, { color: '#f44336' }]}>Excluir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.threadHeaderBorder }]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.renameModal, { backgroundColor: colors.threadCardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Renomear Conversa</Text>
            
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.threadBackground,
                color: colors.text,
                borderColor: colors.threadHeaderBorder
              }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Digite o novo nome da conversa"
              placeholderTextColor={colors.icon}
              autoFocus={true}
              maxLength={50}
            />
            
            <View style={styles.renameButtons}>
              <TouchableOpacity 
                style={[styles.renameButton, { backgroundColor: colors.threadHeaderBorder }]}
                onPress={handleRenameCancel}
              >
                <Text style={[styles.renameButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.renameButton, { backgroundColor: colors.buttonBackground }]}
                onPress={handleRenameConfirm}
                disabled={!newTitle.trim()}
              >
                <Text style={[styles.renameButtonText, { color: colors.buttonText }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 16,
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  threadsContainer: {
    flex: 1,
    padding: 16,
  },
  threadItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  threadDate: {
    fontSize: 12,
  },
  threadPreview: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  renameModal: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  renameButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});