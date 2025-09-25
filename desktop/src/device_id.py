"""
Gerenciador de Device ID para Totari Desktop
Equivalente ao mobile usando expo-secure-store
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

class DeviceIdManager:
    """Gerenciador de Device ID - igual ao mobile"""
    
    def __init__(self):
        self.device_id_file = os.path.expanduser("~/.totari/device_id.json")
        self._ensure_directory()
        
    def _ensure_directory(self):
        """Garantir que o diretório existe"""
        os.makedirs(os.path.dirname(self.device_id_file), exist_ok=True)
        
    def get_or_create_device_id(self) -> str:
        """
        Obter ou criar Device ID - igual ao mobile
        """
        try:
            # Tentar carregar ID existente
            if os.path.exists(self.device_id_file):
                with open(self.device_id_file, 'r') as f:
                    data = json.load(f)
                    device_id = data.get('deviceId')
                    if device_id:
                        logger.info(f"Device ID carregado: {device_id}")
                        return device_id
            
            # Usar o mesmo device ID do mobile para compatibilidade
            mobile_device_id = 'd6b68bca-57c4-4799-80cd-05052c1435f0'
            device_data = {
                'deviceId': mobile_device_id,
                'createdAt': int(datetime.now().timestamp() * 1000)
            }
            
            # Salvar ID
            with open(self.device_id_file, 'w') as f:
                json.dump(device_data, f)
                
            logger.info(f"Device ID do mobile usado: {mobile_device_id}")
            return mobile_device_id
            
        except Exception as e:
            logger.error(f"Erro ao gerenciar Device ID: {e}")
            # Fallback: usar device ID do mobile
            return 'd6b68bca-57c4-4799-80cd-05052c1435f0'

# Instância global
device_id_manager = DeviceIdManager()

def get_or_create_device_id() -> str:
    """Função de conveniência - igual ao mobile"""
    return device_id_manager.get_or_create_device_id()