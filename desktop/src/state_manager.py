"""
Gerenciador de estado para Totari Desktop
Implementação similar ao Zustand do mobile
"""

import logging
import threading
import base64
from typing import List, Optional, Dict, Any, Callable
from datetime import datetime

from .types import Message, Thread, MessageKind, MessageStatus, MessageSource, MessagePayload, AudioPayload, TranscriptPayload
from .device_id import get_or_create_device_id

logger = logging.getLogger(__name__)

class StateManager:
    """Gerenciador de estado centralizado - similar ao Zustand"""
    
    def __init__(self, firestore_manager, transcription_manager):
        self.firestore_manager = firestore_manager
        self.transcription_manager = transcription_manager
        
        # Estado de autenticação
        self.user = None
        self.is_authenticated = False
        
        # Estado de threads
        self.threads = []
        self.current_thread = None
        self.threads_loading = False
        self.threads_error = None
        
        # Estado de mensagens
        self.messages = []
        self.messages_loading = False
        self.messages_error = None
        
        # Callbacks para notificar mudanças
        self.callbacks = {
            'auth_changed': [],
            'threads_changed': [],
            'messages_changed': [],
            'current_thread_changed': []
        }
        
    def subscribe(self, event: str, callback: Callable):
        """Inscrever-se em mudanças de estado"""
        if event in self.callbacks:
            self.callbacks[event].append(callback)
            
    def unsubscribe(self, event: str, callback: Callable):
        """Desinscrever-se de mudanças de estado"""
        if event in self.callbacks and callback in self.callbacks[event]:
            self.callbacks[event].remove(callback)
            
    def _notify(self, event: str, data: Any = None):
        """Notificar callbacks sobre mudanças"""
        for callback in self.callbacks[event]:
            try:
                callback(data)
            except Exception as e:
                logger.error(f"Erro no callback {event}: {e}")
                
    # Métodos de autenticação
    def set_user(self, user: Optional[Dict[str, Any]]):
        """Definir usuário atual"""
        self.user = user
        self.is_authenticated = user is not None
        self._notify('auth_changed', user)
        
    def get_user(self) -> Optional[Dict[str, Any]]:
        """Obter usuário atual"""
        return self.user
        
    def is_user_authenticated(self) -> bool:
        """Verificar se usuário está autenticado"""
        return self.is_authenticated
        
    # Métodos de threads
    def fetch_threads(self) -> None:
        """Buscar threads do usuário"""
        # Não precisa de autenticação com Firebase Admin SDK
            
        self.threads_loading = True
        self.threads_error = None
        self._notify('threads_changed')
        
        try:
            # Buscar todas as threads (conversas globais)
            threads = self.firestore_manager.get_threads()
            self.threads = threads
            self.threads_loading = False
            self._notify('threads_changed')
            logger.info(f"Threads carregadas: {len(threads)}")
            
        except Exception as e:
            self.threads_error = str(e)
            self.threads_loading = False
            self._notify('threads_changed')
            logger.error(f"Erro ao buscar threads: {e}")
            
    def create_thread(self, title: str) -> Optional[Thread]:
        """Criar nova thread"""
        if not self.is_authenticated:
            logger.warning("Usuário não autenticado")
            return None
            
        try:
            device_id = get_or_create_device_id()
            now = int(datetime.now().timestamp() * 1000)
            
            thread = Thread(
                id="",  # Será definido pelo Firestore
                ownerId=device_id,
                title=title,
                createdAt=now,
                updatedAt=now
            )
            
            thread_id = self.firestore_manager.save_thread(thread)
            thread.id = thread_id
            
            # Adicionar à lista local
            self.threads.insert(0, thread)  # Adicionar no início
            self._notify('threads_changed')
            
            logger.info(f"Thread criada: {thread_id}")
            return thread
            
        except Exception as e:
            logger.error(f"Erro ao criar thread: {e}")
            return None
            
    def set_current_thread(self, thread: Optional[Thread]):
        """Definir thread atual"""
        self.current_thread = thread
        self._notify('current_thread_changed', thread)
        
        # Carregar mensagens da thread
        if thread:
            self.fetch_messages(thread.id)
        else:
            self.messages = []
            self._notify('messages_changed')
            
    def delete_thread(self, thread_id: str) -> bool:
        """Deletar thread"""
        try:
            self.firestore_manager.delete_thread(thread_id)
            
            # Remover da lista local
            self.threads = [t for t in self.threads if t.id != thread_id]
            self._notify('threads_changed')
            
            # Se era a thread atual, limpar
            if self.current_thread and self.current_thread.id == thread_id:
                self.set_current_thread(None)
                
            logger.info(f"Thread deletada: {thread_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar thread: {e}")
            return False
            
    # Métodos de mensagens
    def fetch_messages(self, thread_id: str) -> None:
        """Buscar mensagens da thread - versão simplificada"""
        self.messages_loading = True
        self.messages_error = None
        self._notify('messages_changed')
        
        try:
            # Buscar mensagens da thread (conversas globais)
            messages = self.firestore_manager.get_messages(thread_id)
            self.messages = messages
            self.messages_loading = False
            self._notify('messages_changed')
            logger.info(f"Mensagens carregadas: {len(messages)}")
            
        except Exception as e:
            self.messages_error = str(e)
            self.messages_loading = False
            self._notify('messages_changed')
            logger.error(f"Erro ao buscar mensagens: {e}")
            
    def add_message(self, message: Message):
        """Adicionar mensagem à lista local"""
        # Verificar se já existe
        existing = any(m.id == message.id for m in self.messages)
        if not existing:
            self.messages.append(message)
            self._notify('messages_changed')
            
    def update_message(self, message_id: str, updated_message: Message):
        """Atualizar mensagem na lista local"""
        for i, msg in enumerate(self.messages):
            if msg.id == message_id:
                self.messages[i] = updated_message
                self._notify('messages_changed')
                break
                
    def start_audio_recording(self, thread_id: str) -> bool:
        """Iniciar gravação de áudio"""
        if not self.is_authenticated:
            logger.warning("Usuário não autenticado")
            return False
            
        try:
            device_id = get_or_create_device_id()
            now = int(datetime.now().timestamp() * 1000)
            
            # Criar mensagem de áudio
            message = Message(
                id="",  # Será definido pelo Firestore
                threadId=thread_id,
                ownerId=device_id,
                kind=MessageKind.AUDIO,
                source=MessageSource.DESKTOP,
                createdAt=now,
                payload=MessagePayload(),
                status=MessageStatus.RECORDING
            )
            
            # Salvar no Firestore
            message_id = self.firestore_manager.save_message(message)
            message.id = message_id
            
            # Adicionar à lista local
            self.add_message(message)
            
            logger.info(f"Gravação iniciada: {message_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar gravação: {e}")
            return False
            
    def process_audio_recording(self, message_id: str, audio_data: bytes) -> bool:
        """Processar gravação de áudio"""
        try:
            # Converter para base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Criar payload de áudio
            audio_payload = AudioPayload(
                base64=audio_base64,
                contentType='audio/wav',
                durationSec=0,  # Será calculado
                sizeBytes=len(audio_data)
            )
            
            # Atualizar status para transcribing
            self.firestore_manager.update_message_status(message_id, MessageStatus.TRANSCRIBING)
            
            # Atualizar payload
            self.firestore_manager.update_message_payload(message_id, {
                'audio': {
                    'base64': audio_payload.base64,
                    'contentType': audio_payload.contentType,
                    'durationSec': audio_payload.durationSec,
                    'sizeBytes': audio_payload.sizeBytes
                }
            })
            
            # Atualizar mensagem local
            for i, msg in enumerate(self.messages):
                if msg.id == message_id:
                    updated_payload = MessagePayload(audio=audio_payload)
                    updated_message = Message(
                        id=msg.id,
                        threadId=msg.threadId,
                        ownerId=msg.ownerId,
                        kind=msg.kind,
                        source=msg.source,
                        createdAt=msg.createdAt,
                        payload=updated_payload,
                        status=MessageStatus.TRANSCRIBING
                    )
                    self.messages[i] = updated_message
                    self._notify('messages_changed')
                    break
                    
            # Iniciar transcrição em thread separada
            threading.Thread(
                target=self._transcribe_audio,
                args=(message_id, audio_base64),
                daemon=True
            ).start()
            
            logger.info(f"Processamento de áudio iniciado: {message_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar gravação: {e}")
            return False
            
    def _transcribe_audio(self, message_id: str, audio_base64: str):
        """Transcrever áudio em thread separada"""
        try:
            # Fazer transcrição
            result = self.transcription_manager.transcribe_audio(audio_base64)
            
            # Criar payload de transcrição
            transcript_payload = TranscriptPayload(
                text=result['text'],
                words=result.get('words', []),
                languageCode=result.get('language_code', 'pt'),
                confidence=result.get('confidence', 0.8)
            )
            
            # Atualizar payload no Firestore
            self.firestore_manager.update_message_payload(message_id, {
                'transcript': {
                    'text': transcript_payload.text,
                    'words': [
                        {
                            'start': word['start'],
                            'end': word['end'],
                            'word': word['word']
                        } for word in transcript_payload.words
                    ] if transcript_payload.words else None,
                    'languageCode': transcript_payload.languageCode,
                    'confidence': transcript_payload.confidence
                }
            })
            
            # Atualizar status para transcribed
            self.firestore_manager.update_message_status(message_id, MessageStatus.TRANSCRIBED)
            
            # Atualizar mensagem local
            for i, msg in enumerate(self.messages):
                if msg.id == message_id:
                    updated_payload = MessagePayload(
                        audio=msg.payload.audio,
                        transcript=transcript_payload
                    )
                    updated_message = Message(
                        id=msg.id,
                        threadId=msg.threadId,
                        ownerId=msg.ownerId,
                        kind=msg.kind,
                        source=msg.source,
                        createdAt=msg.createdAt,
                        payload=updated_payload,
                        status=MessageStatus.TRANSCRIBED
                    )
                    self.messages[i] = updated_message
                    self._notify('messages_changed')
                    break
                    
            logger.info(f"Transcrição concluída: {message_id}")
            
        except Exception as e:
            logger.error(f"Erro na transcrição: {e}")
            # Marcar como erro
            self.firestore_manager.update_message_status(message_id, MessageStatus.ERROR, str(e))
            
            # Atualizar mensagem local
            for i, msg in enumerate(self.messages):
                if msg.id == message_id:
                    updated_message = Message(
                        id=msg.id,
                        threadId=msg.threadId,
                        ownerId=msg.ownerId,
                        kind=msg.kind,
                        source=msg.source,
                        createdAt=msg.createdAt,
                        payload=msg.payload,
                        status=MessageStatus.ERROR,
                        error=str(e)
                    )
                    self.messages[i] = updated_message
                    self._notify('messages_changed')
                    break
