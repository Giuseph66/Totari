# Totari 🎙️

**Totari** é uma aplicação multiplataforma de comunicação por voz que transforma gravações de áudio em conversas estruturadas e melhoradas através de inteligência artificial. O projeto oferece uma experiência unificada entre dispositivos móveis e desktop, permitindo que usuários gravem mensagens de voz, recebam transcrições automáticas e sugestões de melhoria de texto em tempo real.

## 🎯 Conceito Central

Totari nasce da necessidade de tornar a comunicação por voz mais eficiente e acessível. Em vez de simplesmente gravar e enviar áudios, a aplicação processa cada mensagem através de um pipeline inteligente que:

1. **Captura** mensagens de voz de alta qualidade
2. **Transcreve** automaticamente usando IA (ElevenLabs STT)
3. **Melhora** o texto transcrito com sugestões inteligentes
4. **Organiza** tudo em threads de conversa persistentes
5. **Sincroniza** entre todos os dispositivos do usuário

## 🏗️ Arquitetura do Projeto

O projeto é composto por duas aplicações cliente que compartilham a mesma base de dados e funcionalidades:

### 📱 **Totari Mobile** (React Native + Expo)
- Interface nativa para iOS e Android
- Gravação de áudio otimizada para dispositivos móveis
- Interface de chat moderna com componentes especializados
- Sincronização em tempo real via Firebase
- Gerenciamento de estado com Zustand

### 💻 **Totari Desktop** (Python + PyQt6)
- Cliente desktop para Windows, macOS e Linux
- Funcionalidades idênticas ao mobile
- Interface de bandeja do sistema
- Notificações nativas
- Sincronização em tempo real

## 🔧 Tecnologias Principais

### Backend & Infraestrutura
- **Firebase Firestore** - Banco de dados em tempo real
- **Firebase Storage** - Armazenamento de arquivos de áudio
- **Firebase Auth** - Autenticação de usuários
- **ElevenLabs API** - Transcrição de fala para texto

### Mobile (React Native)
- **Expo** - Framework de desenvolvimento
- **React Native** - Interface nativa
- **Zustand** - Gerenciamento de estado
- **Expo AV** - Gravação e reprodução de áudio

### Desktop (Python)
- **PyQt6** - Interface gráfica
- **PyAudio** - Gravação de áudio
- **Firebase Admin SDK** - Integração com Firebase
- **Plyer** - Notificações nativas

## 🚀 Funcionalidades Principais

### 🎙️ **Gravação Inteligente**
- Gravação de áudio em alta qualidade (AAC, 48kHz)
- Validação de tamanho e duração
- Interface intuitiva de gravação
- Suporte a gravações longas (até 20 minutos)

### 📝 **Processamento de IA**
- Transcrição automática com ElevenLabs STT
- Detecção automática de idioma
- Sugestões de melhoria de texto
- Estruturação de conteúdo (tópicos, insights, resumos)

### 💬 **Interface de Chat**
- Timeline de mensagens em tempo real
- Diferentes tipos de bolhas de mensagem:
  - **Áudio**: Player integrado com controles
  - **Transcrição**: Texto com funcionalidade de cópia
  - **Melhoria**: Conteúdo estruturado com sugestões
- Auto-scroll para novas mensagens
- Timestamps relativos

### 🔄 **Sincronização Universal**
- Dados sincronizados entre todos os dispositivos
- Polling em tempo real (5 segundos)
- Persistência local para uso offline
- Gerenciamento de threads de conversa

### 🔐 **Segurança e Privacidade**
- Autenticação segura via Firebase
- Armazenamento local criptografado
- Chaves de API protegidas (desenvolvimento vs produção)
- Dados do usuário isolados por dispositivo

## 📊 Estrutura de Dados

### Threads de Conversa
```
threads/
├── {thread_id}/
│   ├── userId: string
│   ├── title: string
│   ├── createdAt: timestamp
│   └── messages/
│       ├── {message_id}/
│           ├── type: "audio" | "transcript" | "improvement"
│           ├── content: object
│           └── createdAt: timestamp
```

### Tipos de Mensagem
- **Audio**: Arquivo de áudio + metadados
- **Transcript**: Texto transcrito + idioma detectado
- **Improvement**: Texto melhorado + sugestões + insights

## 🎨 Experiência do Usuário

### Fluxo Principal
1. **Login/Registro** - Autenticação simples e segura
2. **Criar Thread** - Nova conversa ou continuar existente
3. **Gravar Mensagem** - Interface de gravação intuitiva
4. **Processamento** - IA trabalha em background
5. **Visualizar Resultado** - Chat com áudio, transcrição e melhorias
6. **Sincronização** - Dados disponíveis em todos os dispositivos

### Estados de Processamento
- **"Enviado"** - Upload concluído
- **"Transcrevendo..."** - IA processando áudio
- **"Transcrito"** - Texto disponível
- **"Melhorado"** - Sugestões aplicadas

## 🔮 Visão Futura

Totari está projetado para ser uma plataforma de comunicação por voz inteligente, com planos para:

- **Múltiplas Personalidades de IA** - Diferentes estilos de conversa
- **Análise de Sentimento** - Detecção de emoções no áudio
- **Resumos Automáticos** - Sínteses de conversas longas
- **Integração com Calendários** - Agendamento baseado em conversas
- **API Pública** - Integração com outras aplicações

## 🛠️ Desenvolvimento

### Arquitetura Modular
- **Separação clara** entre UI, lógica de negócio e dados
- **Tipagem forte** com TypeScript (mobile) e Python (desktop)
- **Testes automatizados** para componentes críticos
- **Documentação** completa de APIs e componentes

### Padrões de Código
- **Offline-first** - Funciona sem conexão
- **Error handling** robusto com retry automático
- **Logging estruturado** para debugging
- **Configuração centralizada** para diferentes ambientes

---

**Totari** representa uma nova abordagem para comunicação por voz, combinando a naturalidade da fala com o poder da inteligência artificial para criar experiências de conversa mais ricas e produtivas.