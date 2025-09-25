import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePersonalityStore } from '@/src/stores/personalityStore';
import { Personality } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface PersonalityDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectPersonality: (personality: Personality) => void;
  selectedPersonality?: Personality | null;
}

export const PersonalityDrawer: React.FC<PersonalityDrawerProps> = ({
  visible,
  onClose,
  onSelectPersonality,
  selectedPersonality
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { personalities } = usePersonalityStore();


  const renderPersonalityItem = ({ item }: { item: Personality }) => {
    const isActive = selectedPersonality?.id === item.id;
    
    return (
      <View style={[
        styles.personalityItem, 
        { 
          backgroundColor: isActive ? item.color + '10' : colors.cardBackground, 
          borderColor: isActive ? item.color : colors.border,
          borderWidth: isActive ? 2 : 1
        }
      ]}>
        <TouchableOpacity
          style={styles.personalityContent}
          onPress={() => {
            onSelectPersonality(item);
            onClose();
          }}
        >
        <View style={[styles.personalityIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={24} color="white" />
        </View>
        
        <View style={styles.personalityInfo}>
          <View style={styles.personalityHeader}>
            <Text style={[styles.personalityName, { color: colors.text }]}>
              {item.name}
            </Text>
            {isActive && (
              <View style={[styles.activeIndicator, { backgroundColor: item.color }]}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>
          <Text style={[styles.personalityRole, { color: colors.textSecondary }]}>
            {item.role}
          </Text>
          <Text style={[styles.personalityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.personalityMeta}>
            <View style={[styles.ruleCount, { backgroundColor: item.color + '20' }]}>
              <Ionicons name="list" size={12} color={item.color} />
              <Text style={[styles.ruleCountText, { color: item.color }]}>
                {item.rules.length} regras
              </Text>
            </View>
            {item.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.tint + '20' }]}>
                <Text style={[styles.defaultBadgeText, { color: colors.tint }]}>Padrão</Text>
              </View>
            )}
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: item.color }]}>
                <Text style={styles.activeBadgeText}>Ativa</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.drawer, { backgroundColor: colors.threadBackground }]}>
            <View style={[styles.drawerHeader, { borderBottomColor: colors.threadHeaderBorder }]}>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>
                Personalidades da IA
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.personalitiesList}>
              <FlatList
                data={personalities}
                keyExtractor={(item) => item.id}
                renderItem={renderPersonalityItem}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.buttonBackground }]}
              onPress={() => {
                onClose();
                router.push('/(tabs)/personalities');
              }}
            >
              <Ionicons name="add" size={24} color={colors.buttonText} />
              <Text style={[styles.createButtonText, { color: colors.buttonText }]}>
                Gerenciar Personalidades
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  personalitiesList: {
    flex: 1,
    padding: 16,
  },
  personalityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  personalityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  personalityName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  personalityRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  personalityDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  personalityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ruleCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
