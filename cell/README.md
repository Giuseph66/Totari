# Totari Mobile App 📱

**Totari Mobile** é o cliente móvel da plataforma Totari, uma aplicação de comunicação por voz inteligente que transforma gravações de áudio em conversas estruturadas e melhoradas através de inteligência artificial.

## 🎯 Conceito do Aplicativo

Totari Mobile permite que usuários gravem mensagens de voz que são automaticamente processadas por IA para gerar:
- **Transcrições precisas** usando ElevenLabs STT
- **Sugestões de melhoria** de texto
- **Organização inteligente** em threads de conversa
- **Sincronização em tempo real** com outros dispositivos

## 🚀 Funcionalidades Principais

### 🎙️ **Gravação Inteligente**
- Interface de gravação otimizada para dispositivos móveis
- Qualidade de áudio profissional (AAC, 48kHz, mono)
- Validação automática de tamanho (máx. 25MB) e duração (máx. 20 min)
- Feedback visual em tempo real durante a gravação

### 📝 **Processamento Automático**
- **Transcrição instantânea** com ElevenLabs Speech-to-Text
- **Detecção automática de idioma** (português, inglês, espanhol)
- **Sugestões de melhoria** de gramática e clareza
- **Estruturação de conteúdo** com tópicos e insights

### 💬 **Interface de Chat Moderna**
- **Timeline de mensagens** em tempo real
- **Diferentes tipos de bolhas**:
  - 🎵 **Áudio**: Player integrado com controles avançados
  - 📄 **Transcrição**: Texto com funcionalidade de cópia
  - ✨ **Melhoria**: Conteúdo estruturado com sugestões
- **Auto-scroll** para novas mensagens
- **Timestamps relativos** (há 2 minutos, ontem, etc.)

### 🔄 **Sincronização Universal**
- **Dados em tempo real** via Firebase Firestore
- **Polling inteligente** (5 segundos) para atualizações
- **Persistência local** para uso offline
- **Gerenciamento de threads** com criação e organização

### 🔐 **Segurança e Privacidade**
- **Autenticação segura** via Firebase Auth
- **Armazenamento local criptografado** com expo-secure-store
- **Isolamento de dados** por dispositivo
- **Chaves de API protegidas** (desenvolvimento vs produção)

## 🏗️ Arquitetura Técnica

### **Stack Principal**
- **React Native** - Framework multiplataforma
- **Expo** - Ferramentas de desenvolvimento e build
- **TypeScript** - Tipagem estática e melhor DX
- **Zustand** - Gerenciamento de estado simples e eficiente

### **Integrações**
- **Firebase Firestore** - Banco de dados em tempo real
- **Firebase Storage** - Armazenamento de arquivos de áudio
- **Firebase Auth** - Autenticação de usuários
- **ElevenLabs API** - Transcrição de fala para texto

### **Componentes Especializados**
- **Recorder** - Gravação de áudio com controles avançados
- **AudioPlayer** - Reprodução com progress tracking
- **MessageBubble** - Diferentes tipos de mensagem
- **PersonalityDrawer** - Seleção de personalidades de IA

## 📊 Estrutura de Dados

### **Threads de Conversa**
```typescript
interface Thread {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messages: Message[];
}
```

### **Tipos de Mensagem**
```typescript
interface AudioMessage {
  type: 'audio';
  duration: number;
  url: string;
  createdAt: Timestamp;
}

interface TranscriptMessage {
  type: 'transcript';
  text: string;
  language: string;
  createdAt: Timestamp;
}

interface ImprovementMessage {
  type: 'improvement';
  originalText: string;
  improvedText: string;
  suggestions: string[];
  topics: string[];
  insights: string[];
  summary: string;
  createdAt: Timestamp;
}
```

## 🎨 Experiência do Usuário

### **Fluxo Principal**
1. **Autenticação** - Login simples e seguro
2. **Seleção de Thread** - Nova conversa ou continuar existente
3. **Gravação** - Interface intuitiva de gravação
4. **Processamento** - IA trabalha em background
5. **Visualização** - Chat com áudio, transcrição e melhorias
6. **Sincronização** - Dados disponíveis em todos os dispositivos

### **Estados de Processamento**
- 🔄 **"Enviado"** - Upload concluído
- 🎯 **"Transcrevendo..."** - IA processando áudio
- ✅ **"Transcrito"** - Texto disponível
- ✨ **"Melhorado"** - Sugestões aplicadas

## 🛠️ Desenvolvimento

### **Configuração do Ambiente**
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env

# Iniciar aplicação
npx expo start
```

### **Estrutura do Projeto**
```
mobile/
├── app/                    # Telas e roteamento (Expo Router)
├── components/             # Componentes reutilizáveis
├── src/
│   ├── api/               # Clientes de API (Firebase, ElevenLabs)
│   ├── components/        # Componentes especializados
│   ├── config/            # Configurações (Firebase)
│   ├── stores/            # Gerenciamento de estado (Zustand)
│   ├── types/             # Definições TypeScript
│   └── utils/             # Funções utilitárias
├── assets/                # Recursos estáticos
└── constants/             # Constantes e temas
```

### **Padrões de Código**
- **Offline-first** - Funciona sem conexão
- **Error handling** robusto com retry automático
- **Logging estruturado** para debugging
- **Tipagem forte** com TypeScript
- **Componentes modulares** e reutilizáveis

## ⚠️ Segurança e Produção

### **Desenvolvimento**
- Chaves de API diretamente no cliente (apenas para desenvolvimento)
- Configuração via variáveis de ambiente

### **Produção (Obrigatório)**
- **Backend proxy** para chamadas ElevenLabs
- **Remoção de chaves** do cliente
- **Configuração segura** de produção

## 🧪 Testes

```bash
# Executar testes
npm test

# Modo watch
npm run test:watch

# Lint
npm run lint
```

## 📱 Plataformas Suportadas

- **iOS** 13.0+
- **Android** 8.0+ (API 26+)
- **Web** (PWA)

## 🔮 Roadmap

- **Múltiplas Personalidades** - Diferentes estilos de IA
- **Análise de Sentimento** - Detecção de emoções
- **Resumos Automáticos** - Sínteses de conversas
- **Integração com Calendários** - Agendamento inteligente
- **Modo Offline Avançado** - Sincronização inteligente

---

**Totari Mobile** representa o futuro da comunicação por voz, combinando a naturalidade da fala com o poder da inteligência artificial para criar experiências de conversa mais ricas e produtivas em dispositivos móveis.