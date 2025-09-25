"""
Módulo para integração com Firebase Storage
Implementação idêntica ao mobile
"""

import os
import base64
import logging
from typing import Optional, List, Dict, Any
from google.cloud import storage
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)

class StorageManager:
    """Gerenciador de Firebase Storage - igual ao mobile"""
    
    def __init__(self, project_id: str, bucket_name: str):
        self.project_id = project_id
        self.bucket_name = bucket_name
        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)
        
    def upload_file(self, path: str, file_data: bytes, content_type: str = 'application/octet-stream') -> bool:
        """
        Upload de arquivo para Firebase Storage - igual ao mobile
        
        Args:
            path (str): Caminho no storage
            file_data (bytes): Dados do arquivo
            content_type (str): Tipo de conteúdo
            
        Returns:
            bool: True se sucesso, False se falhar
        """
        try:
            blob = self.bucket.blob(path)
            blob.upload_from_string(file_data, content_type=content_type)
            logger.info(f"Arquivo enviado com sucesso: {path}")
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar arquivo {path}: {e}")
            return False
            
    def upload_string_data(self, path: str, data: str, content_type: str = 'application/json') -> bool:
        """
        Upload de string para Firebase Storage - igual ao mobile
        
        Args:
            path (str): Caminho no storage
            data (str): Dados em string
            content_type (str): Tipo de conteúdo
            
        Returns:
            bool: True se sucesso, False se falhar
        """
        try:
            blob = self.bucket.blob(path)
            blob.upload_from_string(data, content_type=content_type)
            logger.info(f"String enviada com sucesso: {path}")
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar string {path}: {e}")
            return False
            
    def get_file_download_url(self, path: str) -> Optional[str]:
        """
        Obter URL de download do arquivo - igual ao mobile
        
        Args:
            path (str): Caminho no storage
            
        Returns:
            Optional[str]: URL de download ou None se falhar
        """
        try:
            blob = self.bucket.blob(path)
            if blob.exists():
                # Gerar URL assinada válida por 1 hora
                url = blob.generate_signed_url(expiration=3600)
                logger.info(f"URL de download gerada: {path}")
                return url
            else:
                logger.warning(f"Arquivo não encontrado: {path}")
                return None
        except Exception as e:
            logger.error(f"Erro ao gerar URL de download {path}: {e}")
            return None
            
    def list_directory_items(self, path: str) -> List[Dict[str, Any]]:
        """
        Listar itens de um diretório - igual ao mobile
        
        Args:
            path (str): Caminho do diretório
            
        Returns:
            List[Dict]: Lista de itens
        """
        try:
            blobs = self.client.list_blobs(self.bucket_name, prefix=path)
            items = []
            for blob in blobs:
                items.append({
                    'name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created': blob.time_created,
                    'updated': blob.updated
                })
            logger.info(f"Listados {len(items)} itens em {path}")
            return items
        except Exception as e:
            logger.error(f"Erro ao listar diretório {path}: {e}")
            return []
            
    def delete_file(self, path: str) -> bool:
        """
        Deletar arquivo do storage
        
        Args:
            path (str): Caminho do arquivo
            
        Returns:
            bool: True se sucesso, False se falhar
        """
        try:
            blob = self.bucket.blob(path)
            blob.delete()
            logger.info(f"Arquivo deletado: {path}")
            return True
        except NotFound:
            logger.warning(f"Arquivo não encontrado para deletar: {path}")
            return True  # Considerar sucesso se não existir
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo {path}: {e}")
            return False
            
    def file_exists(self, path: str) -> bool:
        """
        Verificar se arquivo existe
        
        Args:
            path (str): Caminho do arquivo
            
        Returns:
            bool: True se existe, False se não
        """
        try:
            blob = self.bucket.blob(path)
            return blob.exists()
        except Exception as e:
            logger.error(f"Erro ao verificar existência do arquivo {path}: {e}")
            return False