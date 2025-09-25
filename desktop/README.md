# Totari Desktop

Cliente desktop para Totari usando Python, PyQt6 e Firebase.
**Implementação idêntica ao mobile** com todas as funcionalidades replicadas.

## Funcionalidades

- **Autenticação real** via Firebase (login/registro)
- **Gravação de áudio** com PyAudio (igual ao mobile)
- **Transcrição automática** com ElevenLabs STT
- **Interface de chat** moderna com mensagens em tempo real
- **Gerenciamento de threads** (criar, listar, deletar)
- **Firebase Storage** para upload de arquivos
- **Firebase Firestore** para dados em tempo real
- **Ícone de bandeja** com menu (Abrir, Sair)
- **Notificações nativas** para novas mensagens
- **Sincronização em tempo real** com polling

## Requisitos

- Python 3.8 ou superior
- Linux (testado em Ubuntu)
- Conta Firebase com Firestore configurado
- (Opcional) Conta ElevenLabs para geração de áudio

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd totari-desktop
   ```

2. Crie um ambiente virtual:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

## Configuração

### Firebase
1. Use a chave de conta de serviço fornecida: `@totari-real-firebase-adminsdk-fbsvc-9dab005a86.json`
2. Configure as variáveis de ambiente:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=@totari-real-firebase-adminsdk-fbsvc-9dab005a86.json
   FIREBASE_PROJECT_ID=totari-real
   ```

### ElevenLabs (Opcional)
1. Crie uma conta no ElevenLabs
2. Obtenha sua chave de API
3. Configure a variável de ambiente:
   ```
   ELEVENLABS_API_KEY=sua-chave-de-api
   ```

## Uso

Execute a aplicação:
```bash
python main.py
```

A aplicação iniciará minimizada na bandeja do sistema. Clique com o botão direito no ícone para acessar o menu.

## Estrutura do Projeto

```
totari-desktop/
├── main.py                 # Ponto de entrada principal
├── requirements.txt        # Dependências do projeto
├── .env.example           # Exemplo de variáveis de ambiente
├── README.md              # Documentação
├── @totari-real-firebase-adminsdk-fbsvc-9dab005a86.json  # Chave Firebase
├── src/
│   ├── __init__.py
│   ├── types.py           # Tipos e estruturas de dados (igual ao mobile)
│   ├── auth.py            # Autenticação real com Firebase
│   ├── device_id.py       # Gerenciamento de Device ID
│   ├── firestore.py       # Integração com Firebase Firestore
│   ├── storage.py         # Integração com Firebase Storage
│   ├── audio_recorder.py  # Gravação de áudio com PyAudio
│   ├── transcription.py   # Transcrição com ElevenLabs STT
│   ├── state_manager.py   # Gerenciamento de estado (similar ao Zustand)
│   ├── firebase_config.py # Configuração do Firebase
│   ├── tray.py            # Ícone de bandeja e menu
│   ├── ui.py              # Interface do usuário
│   ├── notifications.py   # Notificações nativas
│   └── utils.py           # Funções utilitárias
└── tests/
    └── __init__.py
```

## Funcionalidades Detalhadas

### Ícone de Bandeja
- **Abrir**: Mostra a janela principal da aplicação
- **Pausar sincronização**: Pausa/retoma o polling de atualizações
- **Sair**: Fecha a aplicação completamente

### Autenticação
- Login com email e senha
- Credenciais armazenadas localmente de forma segura
- Sessão persistente entre reinicializações

### Interface do Usuário
- **View de Login**: Autenticação inicial
- **View de Threads**: Lista de conversas do usuário
- **View de Chat**: Timeline com mensagens em formato de chat

### Mensagens
- **Áudio**: Mensagens de áudio do Firestore
- **Transcrição**: Texto transcrito do Firestore
- **Melhoria**: Sugestões de melhoria de texto do Firestore

### Notificações
- Notificações nativas do sistema quando novas mensagens aparecem
- Clique nas notificações para abrir a thread correspondente

### ElevenLabs
- Geração de áudio a partir de texto
- Integração com vozes multilíngues
- Download automático de áudio gerado

## Estrutura do Firestore

O aplicativo espera a seguinte estrutura no Firestore:

```
threads (collection)
├── {thread_id} (document)
│   ├── userId: string
│   ├── title: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── messages (subcollection)
│       ├── {message_id} (document)
│           ├── type: string (audio|transcript|improvement)
│           ├── createdAt: timestamp
│           └── (campos específicos por tipo)
```

### Tipos de Mensagens

1. **Áudio**:
   ```json
   {
     "type": "audio",
     "duration": 120,
     "url": "https://example.com/audio.wav",
     "createdAt": timestamp
   }
   ```

2. **Transcrição**:
   ```json
   {
     "type": "transcript",
     "text": "Texto transcrito",
     "language": "pt-BR",
     "createdAt": timestamp
   }
   ```

3. **Melhoria**:
   ```json
   {
     "type": "improvement",
     "originalText": "Texto original",
     "improvedText": "Texto melhorado",
     "suggestions": ["Sugestão 1", "Sugestão 2"],
     "createdAt": timestamp
   }
   ```

## Desenvolvimento

### Adicionar novas funcionalidades
1. Crie um novo módulo em `src/`
2. Importe e integre no `main.py`
3. Conecte sinais necessários para comunicação entre componentes

### Testes
```bash
# Executar testes (quando disponíveis)
python -m pytest tests/
```

## Troubleshooting

### Problemas com dependências
```bash
# Reinstalar dependências
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Problemas com Firebase
- Verifique se a chave de conta de serviço está correta
- Certifique-se de que o projeto Firestore está acessível
- Verifique as permissões da conta de serviço

### Problemas com notificações
- Certifique-se de que o plyer está instalado corretamente
- Verifique as permissões do sistema para notificações

## Licença

[Adicionar informação de licença]

## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um novo Pull Request