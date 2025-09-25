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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const PERSONALITY_ICONS = [
  { name: 'person', label: 'Pessoa' },
  { name: 'heart', label: 'Coração' },
  { name: 'star', label: 'Estrela' },
  { name: 'bulb', label: 'Ideia' },
  { name: 'school', label: 'Educação' },
  { name: 'restaurant', label: 'Culinária' },
  { name: 'game-controller', label: 'Jogos' },
  { name: 'musical-notes', label: 'Música' },
  { name: 'book', label: 'Livro' },
  { name: 'camera', label: 'Fotografia' },
  { name: 'car', label: 'Automóvel' },
  { name: 'home', label: 'Casa' },
  { name: 'briefcase', label: 'Trabalho' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'leaf', label: 'Natureza' },
  { name: 'sunny', label: 'Sol' },
  { name: 'moon', label: 'Lua' },
  { name: 'flame', label: 'Fogo' },
  { name: 'snow', label: 'Neve' },
  { name: 'thunderstorm', label: 'Tempestade' },
  { name: 'earth', label: 'Terra' },
  { name: 'rocket', label: 'Foguete' }
];

const PERSONALITY_COLORS = [
  { color: '#FF6B9D', name: 'Rosa' },
  { color: '#4ECDC4', name: 'Turquesa' },
  { color: '#FFA726', name: 'Laranja' },
  { color: '#9C27B0', name: 'Roxo' },
  { color: '#2196F3', name: 'Azul' },
  { color: '#4CAF50', name: 'Verde' },
  { color: '#F44336', name: 'Vermelho' },
  { color: '#FF9800', name: 'Âmbar' },
  { color: '#795548', name: 'Marrom' },
  { color: '#607D8B', name: 'Azul Cinza' },
  { color: '#E91E63', name: 'Rosa Pink' },
  { color: '#00BCD4', name: 'Ciano' },
  { color: '#8BC34A', name: 'Verde Claro' },
  { color: '#FFC107', name: 'Amarelo' },
  { color: '#3F51B5', name: 'Índigo' },
  { color: '#009688', name: 'Teal' },
  { color: '#CDDC39', name: 'Lima' },
  { color: '#FF5722', name: 'Vermelho Profundo' }
];

const PERSONALITY_TEMPLATES = [
  {
    name: 'Amigo Conversacional',
    role: 'Amigo(a) Empático(a)',
    description: 'Um amigo carinhoso e empático que adora conversar sobre qualquer assunto. Sempre tem uma palavra de apoio e gosta de compartilhar experiências.',
    icon: 'heart',
    color: '#FF6B9D',
    rules: [
      'Sempre mantenha um tom amigável e acolhedor',
      'Use emojis ocasionalmente para tornar a conversa mais calorosa',
      'Faça perguntas para demonstrar interesse genuíno',
      'Ofereça apoio e encorajamento quando apropriado'
    ]
  },
  {
    name: 'Professor Especialista',
    role: 'Professor(a) de Conhecimento',
    description: 'Um professor experiente e apaixonado por ensinar. Adora compartilhar conhecimento de forma didática e envolvente, sempre com exemplos práticos.',
    icon: 'school',
    color: '#4ECDC4',
    rules: [
      'Explique conceitos de forma clara e didática',
      'Use exemplos práticos para ilustrar pontos',
      'Mantenha um tom educacional mas acessível',
      'Incentive o aprendizado e curiosidade'
    ]
  },
  {
    name: 'Chef Criativo',
    role: 'Chef de Cozinha',
    description: 'Uma chef experiente e criativa que adora compartilhar receitas, dicas de culinária e histórias sobre comida. Sempre tem uma sugestão deliciosa.',
    icon: 'restaurant',
    color: '#FFA726',
    rules: [
      'Compartilhe dicas práticas de culinária',
      'Use linguagem relacionada à gastronomia',
      'Seja criativa e inspire experimentação',
      'Mantenha um tom caloroso e acolhedor'
    ]
  },
  {
    name: 'Coach Motivacional',
    role: 'Coach de Vida',
    description: 'Um coach motivacional que ajuda pessoas a alcançarem seus objetivos. Sempre tem uma palavra de motivação e estratégias práticas para o sucesso.',
    icon: 'fitness',
    color: '#4CAF50',
    rules: [
      'Seja motivacional e encorajador',
      'Ofereça estratégias práticas e acionáveis',
      'Mantenha um tom positivo e energético',
      'Foque em soluções e crescimento pessoal'
    ]
  }
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    icon: 'person',
    color: '#FF6B9D',
    rules: [] as string[]
  });
  const [newRule, setNewRule] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchPersonalities();
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.role.trim()) {
      errors.role = 'Função é obrigatória';
    } else if (formData.role.trim().length < 3) {
      errors.role = 'Função deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Descrição deve ter pelo menos 10 caracteres';
    }
    
    if (formData.rules.length === 0) {
      errors.rules = 'Adicione pelo menos uma regra';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePersonality = async () => {
    if (!validateForm()) {
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
      Alert.alert('✅ Sucesso', 'Personalidade criada com sucesso!');
    } catch (error) {
      Alert.alert('❌ Erro', 'Falha ao criar personalidade');
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
    setFormErrors({});
  };

  const handleTemplateSelect = (template: typeof PERSONALITY_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      role: template.role,
      description: template.description,
      icon: template.icon,
      color: template.color,
      rules: [...template.rules]
    });
    setShowTemplates(false);
    setFormErrors({});
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
              { backgroundColor: selectedPersonality?.id === item.id ? colors.buttonConfirm : colors.buttonBackground }
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
        {PERSONALITY_ICONS.map((iconData) => (
          <TouchableOpacity
            key={iconData.name}
            onPress={() => setFormData(prev => ({ ...prev, icon: iconData.name }))}
            style={[
              styles.iconOption,
              { 
                backgroundColor: formData.icon === iconData.name ? formData.color : colors.buttonBackground,
                borderColor: formData.icon === iconData.name ? formData.color : colors.border
              }
            ]}
          >
            <Ionicons 
              name={iconData.name as any} 
              size={24} 
              color={formData.icon === iconData.name ? "white" : colors.text} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={[styles.selectorSubtitle, { color: colors.textSecondary }]}>
        {PERSONALITY_ICONS.find(icon => icon.name === formData.icon)?.label}
      </Text>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.colorSelector}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Cor:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {PERSONALITY_COLORS.map((colorData) => (
          <TouchableOpacity
            key={colorData.color}
            onPress={() => setFormData(prev => ({ ...prev, color: colorData.color }))}
            style={[
              styles.colorOption,
              { 
                backgroundColor: colorData.color,
                borderColor: formData.color === colorData.color ? colors.text : 'transparent',
                borderWidth: formData.color === colorData.color ? 3 : 0
              }
            ]}
          />
        ))}
      </ScrollView>
      <Text style={[styles.selectorSubtitle, { color: colors.textSecondary }]}>
        {PERSONALITY_COLORS.find(color => color.color === formData.color)?.name}
      </Text>
    </View>
  );

  const renderPersonalityPreview = () => (
    <View style={[styles.previewSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.previewTitle, { color: colors.text }]}>Preview da Personalidade:</Text>
      <View style={[styles.previewCard, { backgroundColor: formData.color + '20', borderColor: formData.color }]}>
        <View style={[styles.previewIcon, { backgroundColor: formData.color }]}>
          <Ionicons name={formData.icon as any} size={24} color="white" />
        </View>
        <View style={styles.previewInfo}>
          <Text style={[styles.previewName, { color: colors.text }]}>{formData.name || 'Nome da Personalidade'}</Text>
          <Text style={[styles.previewRole, { color: colors.textSecondary }]}>{formData.role || 'Função da Personalidade'}</Text>
          <Text style={[styles.previewDescription, { color: colors.textSecondary }]} numberOfLines={3}>
            {formData.description || 'Descrição da personalidade aparecerá aqui...'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRulesSection = () => (
    <View style={styles.rulesSection}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Regras da Personalidade:</Text>
      {formErrors.rules && (
        <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.rules}</Text>
      )}
      {formData.rules.map((rule, index) => (
        <View key={index} style={[styles.ruleItem, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.ruleNumber, { color: colors.textSecondary }]}>{index + 1}.</Text>
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
            borderColor: formErrors.rules ? colors.error : colors.border 
          }]}
          placeholder="Adicionar nova regra..."
          placeholderTextColor={colors.textSecondary}
          value={newRule}
          onChangeText={setNewRule}
          onSubmitEditing={addRule}
        />
        <TouchableOpacity
          onPress={addRule}
          style={[styles.addRuleButton, { backgroundColor: colors.buttonBackground }]}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTemplatesModal = () => (
    <Modal
      visible={showTemplates}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setShowTemplates(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Templates de Personalidade</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {PERSONALITY_TEMPLATES.map((template, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleTemplateSelect(template)}
              style={[styles.templateCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            >
              <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                <Ionicons name={template.icon as any} size={24} color="white" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, { color: colors.text }]}>{template.name}</Text>
                <Text style={[styles.templateRole, { color: colors.textSecondary }]}>{template.role}</Text>
                <Text style={[styles.templateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {template.description}
                </Text>
                <Text style={[styles.templateRules, { color: colors.textSecondary }]}>
                  {template.rules.length} regras definidas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Personalidades da IA</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setShowTemplates(true)}
            style={[styles.templateButton, { backgroundColor: colors.buttonBackground }]}
          >
            <Ionicons name="library-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[styles.addButton, { backgroundColor: colors.buttonBackground }]}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
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

      <View style={styles.listContainer}>
        <FlatList
          data={personalities}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonalityItem}
        />
      </View>

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
              style={[styles.modalSaveButton, { backgroundColor: colors.buttonBackground }]}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {renderPersonalityPreview()}
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nome *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: formErrors.name ? colors.error : colors.border 
                }]}
                placeholder="Ex: Alice, Dr. Silva, Chef Maria"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, name: text }));
                  if (formErrors.name) {
                    setFormErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
              />
              {formErrors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.name}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Função *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: formErrors.role ? colors.error : colors.border 
                }]}
                placeholder="Ex: Amiga Conversacional, Professor de História"
                placeholderTextColor={colors.textSecondary}
                value={formData.role}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, role: text }));
                  if (formErrors.role) {
                    setFormErrors(prev => ({ ...prev, role: '' }));
                  }
                }}
              />
              {formErrors.role && (
                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.role}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Descrição *</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text,
                  borderColor: formErrors.description ? colors.error : colors.border 
                }]}
                placeholder="Descreva como essa personalidade se comporta..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, description: text }));
                  if (formErrors.description) {
                    setFormErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                multiline
                numberOfLines={4}
              />
              {formErrors.description && (
                <Text style={[styles.errorText, { color: colors.error }]}>{formErrors.description}</Text>
              )}
            </View>

            {renderIconSelector()}
            {renderColorSelector()}
            {renderRulesSection()}
          </ScrollView>
        </View>
      </Modal>

      {renderTemplatesModal()}
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  templateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  previewSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectorSubtitle: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  ruleNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  templateRules: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
