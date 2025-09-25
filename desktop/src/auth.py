"""
Módulo para autenticação com Firebase
Implementação idêntica ao mobile usando Firebase Client SDK
"""

import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any

# Carregar variáveis de ambiente
load_dotenv()

logger = logging.getLogger(__name__)

class AuthManager:
    """Gerenciador de autenticação com Firebase - igual ao mobile"""
    
    def __init__(self):
        self.current_user = None
        self.firebase_initialized = False
        self.db = None
        self._initialize_firebase()
        
    def _initialize_firebase(self):
        """Inicializar Firebase Client SDK"""
        try:
            # Importar Firebase Client SDK
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            # Obter caminho da chave de serviço
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')
            
            # Se não estiver definida no .env, usar o caminho padrão
            if not service_account_path:
                service_account_path = '/home/jesus/Progetos/Totari/desktop/totari-real-firebase-adminsdk-fbsvc-9dab005a86.json'
            
            if service_account_path and os.path.exists(service_account_path):
                # Usar chave de serviço
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.firebase_initialized = True
                logger.info("Firebase Admin SDK inicializado com chave de serviço")
            else:
                logger.warning(f"Chave de serviço não encontrada em: {service_account_path}")
                self.firebase_initialized = False
                self.db = None
                    
        except ImportError:
            logger.warning("Firebase Admin SDK não disponível")
            self.firebase_initialized = False
            self.db = None
        except Exception as e:
            logger.error(f"Erro ao inicializar Firebase: {e}")
            self.firebase_initialized = False
            self.db = None
            
    def login(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Fazer login real via Firestore - igual ao mobile
        """
        if not self.db:
            logger.error("Firebase não inicializado")
            return None
            
        try:
            # Buscar usuário no Firestore
            users_ref = self.db.collection('users')
            query = users_ref.where('email', '==', email).where('password', '==', password)
            docs = query.stream()
            
            users = list(docs)
            if not users:
                logger.warning(f"Usuário não encontrado: {email}")
                return None
            
            # Pegar o primeiro usuário encontrado
            user_doc = users[0]
            user_data = user_doc.to_dict()
            
            # Atualizar lastLoginAt
            from google.cloud import firestore
            user_ref = self.db.collection('users').document(user_doc.id)
            user_ref.update({'lastLoginAt': firestore.SERVER_TIMESTAMP})
            
            # Criar objeto de usuário
            self.current_user = {
                'id': user_doc.id,
                'email': user_data['email'],
                'name': user_data['name'],
                'password': user_data['password'],
                'createdAt': user_data.get('createdAt'),
                'lastLoginAt': datetime.now()
            }
            
            logger.info(f"Usuário logado com sucesso: {email}")
            return self.current_user
            
        except Exception as e:
            logger.error(f"Erro no login: {e}")
            return None
            
    def register(self, email: str, password: str, display_name: str) -> Optional[Dict[str, Any]]:
        """
        Registrar novo usuário - igual ao mobile
        """
        if not self.db:
            logger.error("Firebase não inicializado")
            return None
            
        try:
            # Verificar se usuário já existe
            users_ref = self.db.collection('users')
            query = users_ref.where('email', '==', email)
            docs = list(query.stream())
            
            if docs:
                logger.warning(f"Usuário já existe: {email}")
                return None
            
            # Criar novo usuário
            from google.cloud import firestore
            user_data = {
                'email': email,
                'name': display_name,
                'password': password,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'lastLoginAt': firestore.SERVER_TIMESTAMP
            }
            
            # Salvar no Firestore
            doc_ref = users_ref.add(user_data)
            user_id = doc_ref[1].id  # ID do documento criado
            
            # Criar objeto de usuário
            self.current_user = {
                'id': user_id,
                'email': email,
                'name': display_name,
                'password': password,
                'createdAt': datetime.now(),
                'lastLoginAt': datetime.now()
            }
            
            logger.info(f"Usuário registrado com sucesso: {email}")
            return self.current_user
            
        except Exception as e:
            logger.error(f"Erro no registro: {e}")
            return None
        
    def logout(self):
        """Fazer logout"""
        self.current_user = None
        logger.info("Usuário deslogado")
        
    def is_authenticated(self) -> bool:
        """Verificar se usuário está autenticado"""
        return self.current_user is not None and self.firebase_initialized
        
    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Obter usuário atual"""
        return self.current_user
        
    def get_user_id(self) -> Optional[str]:
        """Obter ID do usuário"""
        if self.current_user:
            return self.current_user.get('id')
        return None
        
    def get_firestore_db(self):
        """Obter instância do Firestore"""
        return self.db