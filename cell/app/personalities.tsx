import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePersonalityStore } from '@/src/stores/personalityStore';
import { Personality } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const PERSONALITY_ICONS = [
  'person', 'heart', 'star', 'bulb', 'school', 'restaurant', 'game-controller',
  'musical-notes', 'book', 'camera', 'car', 'home', 'briefcase', 'fitness',
  'leaf', 'sunny', 'moon', 'flame', 'snow', 'thunderstorm', 'earth', 'rocket'
];

const PERSONALITY_COLORS = [
  '#FF6B9D', '#4ECDC4', '#FFA726', '#9C27B0', '#2196F3', '#4CAF50',
  '#F44336', '#FF9800', '#795548', '#607D8B', '#E91E63', '#00BCD4',
  '#8BC34A', '#FFC107', '#3F51B5', '#009688', '#CDDC39', '#FF5722'
];

export default function PersonalitiesScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const {
    personalities,
    selectedPersonality,
    loading,
    error,
    fetchPersonalities,
    createPersonality,
    updatePersonality,
    deletePersonality,
    selectPersonality
  } = usePersonalityStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    icon: 'person',
    color: '#FF6B9D',
    rules: [] as string[]
  });
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    fetchPersonalities();
  }, []);

  const handleCreatePersonality = async () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createPersonality({
        name: formData.name.trim(),
        role: formData.role.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color,
        rules: formData.rules.filter(rule => rule.trim()),
        isDefault: false
      });

      setShowCreateModal(false);
      resetForm();
      Alert.alert('Sucesso', 'Personalidade criada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar personalidade');
    }
  };

  const handleUpdatePersonality = async () => {
    if (!editingPersonality || !formData.name.trim() || !formData.role.trim() || !formData.description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await updatePersonality(editingPersonality.id, {
        name: formData.name.trim(),
        role: formData.role.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color,
        rules: formData.rules.filter(rule => rule.trim())
      });

      setEditingPersonality(null);
      resetForm();
      Alert.alert('Sucesso', 'Personalidade atualizada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar personalidade');
    }
  };

  const handleDeletePersonality = (personality: Personality) => {
    if (personality.isDefault) {
      Alert.alert('Erro', 'Não é possível excluir personalidades padrão');
      return;
    }

    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a personalidade "${personality.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonality(personality.id);
              Alert.alert('Sucesso', 'Personalidade excluída com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir personalidade');
            }
          }
        }
      ]
    );
  };

  const handleEditPersonality = (personality: Personality) => {
    setEditingPersonality(personality);
    setFormData({
      name: personality.name,
      role: personality.role,
      description: personality.description,
      icon: personality.icon,
      color: personality.color,
      rules: [...personality.rules]
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      description: '',
      icon: 'person',
      color: '#FF6B9D',
      rules: []
    });
    setNewRule('');
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const renderPersonalityItem = ({ item }: { item: Personality }) => (
    <View style={[styles.personalityCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.personalityHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={24} color="white" />
        </View>
        <View style={styles.personalityInfo}>
          <Text style={[styles.personalityName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.personalityRole, { color: colors.textSecondary }]}>{item.role}</Text>
          <Text style={[styles.personalityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.personalityActions}>
          <TouchableOpacity
            onPress={() => selectPersonality(item)}
            style={[
              styles.actionButton,
              { backgroundColor: selectedPersonality?.id === item.id ? colors.tint : colors.buttonBackground }
            ]}
          >
            <Ionicons 
              name={selectedPersonality?.id === item.id ? "checkmark" : "checkmark-outline"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEditPersonality(item)}
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
          >
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
          {!item.isDefault && (
            <TouchableOpacity
              onPress={() => handleDeletePersonality(item)}
              style={[styles.actionButton, { backgroundColor: colors.error }]}
            >
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderIconSelector = () => (
    <View style={styles.iconSelector}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Ícone:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {PERSONALITY_ICONS.map((icon) => (
          <TouchableOpacity
            key={icon}
            onPress={() => setFormData(prev => ({ ...prev, icon }))}
            style={[
              styles.iconOption,
              { 
                backgroundColor: formData.icon === icon ? formData.color : colors.buttonBackground,
                borderColor: formData.icon === icon ? formData.color : colors.border
              }
            ]}
          >
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={formData.icon === icon ? "white" : colors.text} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.colorSelector}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Cor:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {PERSONALITY_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setFormData(prev => ({ ...prev, color }))}
            style={[
              styles.colorOption,
              { 
                backgroundColor: color,
                borderColor: formData.color === color ? colors.text : 'transparent',
                borderWidth: formData.color === color ? 3 : 0
              }
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderRulesSection = () => (
    <View style={styles.rulesSection}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Regras da Personalidade:</Text>
      {formData.rules.map((rule, index) => (
        <View key={index} style={[styles.ruleItem, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.ruleText, { color: colors.text }]}>{rule}</Text>
          <TouchableOpacity
            onPress={() => removeRule(index)}
            style={[styles.removeRuleButton, { backgroundColor: colors.error }]}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addRuleContainer}>
        <TextInput
          style={[styles.ruleInput, { 
            backgroundColor: colors.inputBackground, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          placeholder="Adicionar nova regra..."
          placeholderTextColor={colors.textSecondary}
          value={newRule}
          onChangeText={setNewRule}
          onSubmitEditing={addRule}
        />
        <TouchableOpacity
          onPress={addRule}
          style={[styles.addRuleButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Personalidades da IA</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {selectedPersonality && (
        <View style={[styles.selectedPersonality, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[styles.selectedIcon, { backgroundColor: selectedPersonality.color }]}>
            <Ionicons name={selectedPersonality.icon as any} size={20} color="white" />
          </View>
          <Text style={[styles.selectedText, { color: colors.text }]}>
            Ativa: {selectedPersonality.name}
          </Text>
        </View>
      )}

      <FlatList
        data={personalities}
        keyExtractor={(item) => item.id}
        renderItem={renderPersonalityItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal || editingPersonality !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                setEditingPersonality(null);
                resetForm();
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingPersonality ? 'Editar Personalidade' : 'Nova Personalidade'}
            </Text>
            <TouchableOpacity
              onPress={editingPersonality ? handleUpdatePersonality : handleCreatePersonality}
              style={[styles.modalSaveButton, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nome *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Ex: Alice, Dr. Silva, Chef Maria"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Função *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Ex: Amiga Conversacional, Professor de História"
                placeholderTextColor={colors.textSecondary}
                value={formData.role}
                onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Descrição *</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="Descreva como essa personalidade se comporta..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {renderIconSelector()}
            {renderColorSelector()}
            {renderRulesSection()}
          </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPersonality: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  personalityCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personalityInfo: {
    flex: 1,
    marginRight: 12,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  personalityRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  personalityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  personalityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  iconSelector: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  colorSelector: {
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
  },
  rulesSection: {
    marginBottom: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
  },
  removeRuleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addRuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ruleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addRuleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
