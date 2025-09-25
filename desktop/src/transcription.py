"""
Módulo para transcrição de áudio
Implementação idêntica ao mobile usando ElevenLabs
"""

import os
import base64
import requests
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class TranscriptionManager:
    """Gerenciador de transcrição - igual ao mobile"""
    
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        self.is_enabled = bool(self.api_key)
        
        if self.is_enabled:
            logger.info("Transcrição ElevenLabs habilitada")
        else:
            logger.warning("Transcrição ElevenLabs desabilitada - chave de API não configurada")
            
    def transcribe_audio(self, base64_audio: str, content_type: str = 'audio/wav') -> Dict[str, Any]:
        """
        Transcrever áudio usando ElevenLabs - igual ao mobile
        
        Args:
            base64_audio (str): Áudio em base64
            content_type (str): Tipo de conteúdo do áudio
            
        Returns:
            Dict: Resultado da transcrição
        """
        if not self.is_enabled:
            logger.warning("Transcrição desabilitada")
            return self._get_fallback_result()
            
        try:
            # Corrigir padding do base64
            fixed_base64 = base64_audio.padEnd(base64_audio.length + (4 - base64_audio.length % 4) % 4, '=')
            
            logger.info('Iniciando transcrição com ElevenLabs...', {
                'base64_length': len(base64_audio),
                'api_key': 'Present' if self.api_key else 'Missing'
            })
            
            # Converter base64 para bytes
            audio_bytes = base64.b64decode(fixed_base64)
            
            # Preparar dados para upload
            files = {
                'file': ('audio.wav', audio_bytes, 'audio/wav')
            }
            
            data = {
                'model_id': 'scribe_v1'
            }
            
            headers = {
                'xi-api-key': self.api_key,
                'Accept': 'application/json'
            }
            
            # Fazer requisição
            response = requests.post(
                f"{self.base_url}/speech-to-text",
                files=files,
                data=data,
                headers=headers,
                timeout=120  # 2 minutos
            )
            
            response.raise_for_status()
            
            result = response.json()
            logger.info('Transcrição ElevenLabs concluída')
            
            return {
                'text': result.get('text', result.get('transcript', '')),
                'words': result.get('words', []),
                'language_code': result.get('language_code', 'pt'),
                'confidence': result.get('confidence', 0.8)
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f'Erro na requisição ElevenLabs: {e}')
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f'Status da resposta: {e.response.status_code}')
                logger.error(f'Dados da resposta: {e.response.text}')
            return self._get_fallback_result()
            
        except Exception as e:
            logger.error(f'Erro na transcrição: {e}')
            return self._get_fallback_result()
            
    def _get_fallback_result(self) -> Dict[str, Any]:
        """Resultado de fallback quando transcrição falha"""
        return {
            'text': 'Transcrição não disponível no momento',
            'words': [],
            'language_code': 'pt',
            'confidence': 0
        }
        
    def is_available(self) -> bool:
        """Verificar se transcrição está disponível"""
        return self.is_enabled
