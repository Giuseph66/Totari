"""
Módulo para integração com Firestore
Implementação idêntica ao mobile
"""

import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud import firestore

from .types import Message, Thread, MessageKind, MessageStatus, MessageSource, message_to_dict, message_from_dict, thread_to_dict, thread_from_dict
from .device_id import get_or_create_device_id

logger = logging.getLogger(__name__)

class FirestoreManager:
    """Gerenciador de integração com Firestore - igual ao mobile"""
    
    def __init__(self, auth_manager=None):
        # Inicializar Firebase diretamente
        from google.cloud import firestore
        self.db = firestore.Client()
        
    def save_message(self, message: Message) -> str:
        """
        Salvar mensagem no Firestore - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            message_dict = message_to_dict(message)
            # Remover id do dict para criar novo documento
            message_id = message_dict.pop('id')
            
            doc_ref = self.db.collection('messages').add(message_dict)
            return doc_ref[1].id  # ID do documento criado
            
        except Exception as e:
            logger.error(f"Erro ao salvar mensagem: {e}")
            raise Exception("Falha ao salvar mensagem")
            
    def get_messages(self, thread_id: str, owner_id: str = None) -> List[Message]:
        """
        Obter mensagens de uma thread (conversas globais)
        """
        if not self.db:
            return []
            
        try:
            messages_ref = self.db.collection('messages')
            # Buscar mensagens apenas por threadId (sem filtro de ownerId)
            query = messages_ref.where('threadId', '==', thread_id)
            docs = query.stream()
            
            messages = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                # Converter timestamp do Firestore para timestamp Unix
                if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
                    data['createdAt'] = int(data['createdAt'].timestamp() * 1000)
                messages.append(message_from_dict(data))
                
            # Ordenar por data de criação
            messages.sort(key=lambda x: x.createdAt)
            
            logger.info(f"Encontradas {len(messages)} mensagens na thread {thread_id}")
            return messages
            
        except Exception as e:
            logger.error(f"Erro ao obter mensagens da thread {thread_id}: {e}")
            return []
            
    def update_message_status(self, message_id: str, status: MessageStatus, error: Optional[str] = None) -> None:
        """
        Atualizar status da mensagem - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            message_ref = self.db.collection('messages').document(message_id)
            update_data = {
                'status': status.value,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
            
            if error is not None:
                update_data['error'] = error
                
            message_ref.update(update_data)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar status da mensagem {message_id}: {e}")
            raise Exception("Falha ao atualizar status da mensagem")
            
    def update_message_payload(self, message_id: str, payload_updates: Dict[str, Any]) -> None:
        """
        Atualizar payload da mensagem - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            message_ref = self.db.collection('messages').document(message_id)
            
            # Obter mensagem atual para merge com payload existente
            current_doc = message_ref.get()
            current_payload = {}
            
            if current_doc.exists:
                current_data = current_doc.to_dict()
                current_payload = current_data.get('payload', {})
            
            # Merge com atualizações
            merged_payload = {**current_payload, **payload_updates}
            
            message_ref.update({
                'payload': merged_payload,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
        except Exception as e:
            logger.error(f"Erro ao atualizar payload da mensagem {message_id}: {e}")
            raise Exception("Falha ao atualizar payload da mensagem")
            
    def delete_message(self, message_id: str) -> None:
        """
        Deletar mensagem - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            message_ref = self.db.collection('messages').document(message_id)
            message_ref.delete()
            
        except Exception as e:
            logger.error(f"Erro ao deletar mensagem {message_id}: {e}")
            raise Exception("Falha ao deletar mensagem")
            
    def save_thread(self, thread: Thread) -> str:
        """
        Salvar thread - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            thread_dict = thread_to_dict(thread)
            # Remover id do dict para criar novo documento
            thread_id = thread_dict.pop('id')
            
            doc_ref = self.db.collection('threads').add(thread_dict)
            return doc_ref[1].id  # ID do documento criado
            
        except Exception as e:
            logger.error(f"Erro ao salvar thread: {e}")
            raise Exception("Falha ao salvar thread")
            
    def get_thread(self, thread_id: str) -> Optional[Thread]:
        """
        Obter thread por ID - igual ao mobile
        """
        if not self.db:
            return None
            
        try:
            thread_ref = self.db.collection('threads').document(thread_id)
            thread_doc = thread_ref.get()
            
            if thread_doc.exists:
                data = thread_doc.to_dict()
                data['id'] = thread_doc.id
                # Converter timestamp do Firestore para timestamp Unix
                if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
                    data['createdAt'] = int(data['createdAt'].timestamp() * 1000)
                if 'updatedAt' in data and hasattr(data['updatedAt'], 'timestamp'):
                    data['updatedAt'] = int(data['updatedAt'].timestamp() * 1000)
                return thread_from_dict(data)
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter thread {thread_id}: {e}")
            return None
            
    def get_threads(self, owner_id: str = None) -> List[Thread]:
        """
        Obter todas as threads (conversas globais)
        """
        if not self.db:
            return []
            
        try:
            threads_ref = self.db.collection('threads')
            # Buscar todas as threads sem filtro de ownerId
            docs = threads_ref.stream()
            threads = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                # Converter timestamp do Firestore para timestamp Unix
                if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
                    data['createdAt'] = int(data['createdAt'].timestamp() * 1000)
                if 'updatedAt' in data and hasattr(data['updatedAt'], 'timestamp'):
                    data['updatedAt'] = int(data['updatedAt'].timestamp() * 1000)
                threads.append(thread_from_dict(data))
                
            # Ordenar por data de atualização (mais recente primeiro)
            threads.sort(key=lambda x: x.updatedAt, reverse=True)
            
            logger.info(f"Encontradas {len(threads)} threads globais")
            return threads
            
        except Exception as e:
            logger.error(f"Erro ao obter threads: {e}")
            return []
            
    def update_thread(self, thread_id: str, updates: Dict[str, Any]) -> None:
        """
        Atualizar thread - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            thread_ref = self.db.collection('threads').document(thread_id)
            update_data = {
                **updates,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
            thread_ref.update(update_data)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar thread {thread_id}: {e}")
            raise Exception("Falha ao atualizar thread")
            
    def delete_thread(self, thread_id: str) -> None:
        """
        Deletar thread - igual ao mobile
        """
        if not self.db:
            raise Exception("Firebase não inicializado")
            
        try:
            thread_ref = self.db.collection('threads').document(thread_id)
            thread_ref.delete()
            
        except Exception as e:
            logger.error(f"Erro ao deletar thread {thread_id}: {e}")
            raise Exception("Falha ao deletar thread")
            
    def subscribe_to_messages(self, thread_id: str, device_id: str, on_update: Callable[[List[Message]], None]) -> Callable[[], None]:
        """
        Inscrever-se para atualizações em tempo real - igual ao mobile
        """
        if not self.db:
            return lambda: None
            
        try:
            messages_ref = self.db.collection('messages')
            query = messages_ref.where('threadId', '==', thread_id).where('deviceId', '==', device_id)
            
            def on_snapshot(query_snapshot, changes, read_time):
                messages = []
                for doc in query_snapshot:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    # Converter timestamp do Firestore para timestamp Unix
                    if 'createdAt' in data and hasattr(data['createdAt'], 'timestamp'):
                        data['createdAt'] = int(data['createdAt'].timestamp() * 1000)
                    messages.append(message_from_dict(data))
                
                # Ordenar por data de criação
                messages.sort(key=lambda x: x.createdAt)
                on_update(messages)
            
            unsubscribe = query.on_snapshot(on_snapshot)
            return unsubscribe
            
        except Exception as e:
            logger.error(f"Erro ao se inscrever em mensagens da thread {thread_id}: {e}")
            return lambda: None