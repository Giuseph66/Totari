"""
Módulo para integração com ElevenLabs
"""

import os
import requests
import json
from dotenv import load_dotenv
import logging

# Carregar variáveis de ambiente
load_dotenv()

logger = logging.getLogger(__name__)

class ElevenLabsManager:
    """Gerenciador de integração com ElevenLabs"""
    
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        self.is_enabled = bool(self.api_key)
        
        if self.is_enabled:
            logger.info("ElevenLabs habilitado")
        else:
            logger.warning("ElevenLabs desabilitado - chave de API não configurada")
            
    def get_voices(self):
        """
        Obter lista de vozes disponíveis
        
        Returns:
            dict: Lista de vozes ou None se falhar
        """
        if not self.is_enabled:
            return None
            
        try:
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.api_key
            }
            
            response = requests.get(f"{self.base_url}/voices", headers=headers)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Erro ao obter vozes do ElevenLabs: {e}")
            return None
            
    def generate_audio(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM", model_id: str = "eleven_multilingual_v1"):
        """
        Gerar áudio a partir de texto usando ElevenLabs
        
        Args:
            text (str): Texto para gerar áudio
            voice_id (str): ID da voz a ser usada
            model_id (str): ID do modelo a ser usado
            
        Returns:
            bytes: Áudio em bytes ou None se falhar
        """
        if not self.is_enabled:
            return None
            
        try:
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            data = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5
                }
            }
            
            response = requests.post(
                f"{self.base_url}/text-to-speech/{voice_id}",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            
            return response.content
            
        except Exception as e:
            logger.error(f"Erro ao gerar áudio com ElevenLabs: {e}")
            return None
            
    def save_audio(self, audio_data: bytes, filename: str):
        """
        Salvar áudio em arquivo
        
        Args:
            audio_data (bytes): Dados de áudio
            filename (str): Nome do arquivo
            
        Returns:
            bool: True se sucesso, False se falhar
        """
        try:
            with open(filename, 'wb') as f:
                f.write(audio_data)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar áudio: {e}")
            return False