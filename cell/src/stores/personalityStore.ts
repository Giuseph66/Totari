import { create } from 'zustand';
import { deletePersonality as deletePersonalityFromFirestore, getPersonalities, savePersonality, updatePersonality } from '../api/firestore';
import { Personality } from '../types';

interface PersonalityState {
  personalities: Personality[];
  selectedPersonality: Personality | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPersonalities: () => Promise<void>;
  createPersonality: (personality: Omit<Personality, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePersonality: (id: string, updates: Partial<Personality>) => Promise<void>;
  deletePersonality: (id: string) => Promise<void>;
  selectPersonality: (personality: Personality | null) => void;
  getPersonalityById: (id: string) => Personality | undefined;
}

// Personalidades padrão
const defaultPersonalities: Personality[] = [
  {
    id: '1',
    name: 'Alice',
    role: 'Amiga Conversacional',
    description: 'Uma amiga empática e divertida que adora conversar sobre qualquer assunto. Sempre tem uma opinião interessante e gosta de dar conselhos com bom humor.',
    rules: [
      'Sempre mantenha um tom amigável e empático',
      'Use emojis ocasionalmente para tornar a conversa mais divertida',
      'Faça perguntas para demonstrar interesse genuíno',
      'Evite ser muito formal ou técnico'
    ],
    icon: 'heart',
    color: '#FF6B9D',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '2',
    name: 'Dr. Silva',
    role: 'Professor de História',
    description: 'Um professor apaixonado por história que adora compartilhar conhecimento de forma didática e envolvente. Sempre tem uma história interessante para contar.',
    rules: [
      'Sempre explique conceitos de forma didática e clara',
      'Use exemplos históricos para ilustrar pontos',
      'Mantenha um tom educacional mas acessível',
      'Incentive o aprendizado e curiosidade'
    ],
    icon: 'school',
    color: '#4ECDC4',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '3',
    name: 'Chef Maria',
    role: 'Chef de Cozinha',
    description: 'Uma chef experiente e criativa que adora compartilhar receitas, dicas de culinária e histórias sobre comida. Sempre tem uma sugestão deliciosa.',
    rules: [
      'Sempre compartilhe dicas práticas de culinária',
      'Use linguagem relacionada à gastronomia',
      'Seja criativa e inspire experimentação',
      'Mantenha um tom caloroso e acolhedor'
    ],
    icon: 'restaurant',
    color: '#FFA726',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const usePersonalityStore = create<PersonalityState>((set, get) => ({
  personalities: defaultPersonalities,
  selectedPersonality: defaultPersonalities[0] || null,
  loading: false,
  error: null,
  
  fetchPersonalities: async () => {
    set({ loading: true, error: null });
    try {
      // Buscar personalidades do Firebase
      const userPersonalities = await getPersonalities();
      
      // Combinar personalidades padrão com as do usuário
      const allPersonalities = [...defaultPersonalities, ...userPersonalities];
      
      set({ personalities: allPersonalities, loading: false });
    } catch (error) {
      console.error('Error fetching personalities:', error);
      // Em caso de erro, usar apenas as personalidades padrão
      set({ 
        personalities: defaultPersonalities,
        error: error instanceof Error ? error.message : 'Failed to fetch personalities',
        loading: false 
      });
    }
  },
  
  createPersonality: async (personalityData) => {
    try {
      // Salvar no Firebase
      const personalityId = await savePersonality(personalityData);
      
      // Criar objeto da personalidade com ID do Firebase
      const newPersonality: Personality = {
        ...personalityData,
        id: personalityId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Atualizar estado local
      set(state => ({
        personalities: [...state.personalities, newPersonality]
      }));
    } catch (error) {
      console.error('Error creating personality:', error);
      throw error instanceof Error ? error : new Error('Failed to create personality');
    }
  },
  
  updatePersonality: async (id, updates) => {
    try {
      // Verificar se é uma personalidade padrão (não pode ser editada)
      const personality = get().personalities.find(p => p.id === id);
      if (personality?.isDefault) {
        throw new Error('Cannot update default personalities');
      }
      
      // Atualizar no Firebase
      await updatePersonality(id, updates);
      
      // Atualizar estado local
      set(state => ({
        personalities: state.personalities.map(personality => 
          personality.id === id 
            ? { ...personality, ...updates, updatedAt: Date.now() }
            : personality
        )
      }));
    } catch (error) {
      console.error('Error updating personality:', error);
      throw error instanceof Error ? error : new Error('Failed to update personality');
    }
  },
  
  deletePersonality: async (id) => {
    try {
      // Verificar se é uma personalidade padrão (não pode ser deletada)
      const personality = get().personalities.find(p => p.id === id);
      if (personality?.isDefault) {
        throw new Error('Cannot delete default personalities');
      }
      
      // Deletar do Firebase
      await deletePersonalityFromFirestore(id);
      
      // Atualizar estado local
      set(state => ({
        personalities: state.personalities.filter(personality => personality.id !== id),
        selectedPersonality: state.selectedPersonality?.id === id ? null : state.selectedPersonality
      }));
    } catch (error) {
      console.error('Error deleting personality:', error);
      throw error instanceof Error ? error : new Error('Failed to delete personality');
    }
  },
  
  selectPersonality: (personality) => {
    set({ selectedPersonality: personality });
  },
  
  getPersonalityById: (id) => {
    return get().personalities.find(personality => personality.id === id);
  }
}));
