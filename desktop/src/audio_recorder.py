"""
Módulo para gravação de áudio no desktop
Implementação idêntica ao mobile usando PyAudio
"""

import os
import wave
import base64
import threading
import time
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    logging.warning("PyAudio não disponível - gravação de áudio desabilitada")

from .types import Message, MessageKind, MessageStatus, MessageSource, MessagePayload, AudioPayload
from .device_id import get_or_create_device_id

logger = logging.getLogger(__name__)

class AudioRecorder:
    """Gravador de áudio - igual ao mobile"""
    
    def __init__(self):
        self.is_recording = False
        self.recording_thread = None
        self.audio_data = []
        self.duration = 0
        self.start_time = None
        
        # Configurações de áudio (igual ao mobile)
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16 if PYAUDIO_AVAILABLE else None
        self.CHANNELS = 1  # Mono
        self.RATE = 44100  # 44.1 kHz
        self.MAX_DURATION = 20 * 60  # 20 minutos máximo
        self.MIN_DURATION = 1  # 1 segundo mínimo
        self.MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB máximo
        
    def start_recording(self) -> bool:
        """
        Iniciar gravação - igual ao mobile
        """
        if not PYAUDIO_AVAILABLE:
            logger.error("PyAudio não disponível")
            return False
            
        if self.is_recording:
            logger.warning("Gravação já em andamento")
            return False
            
        try:
            self.audio_data = []
            self.duration = 0
            self.is_recording = True
            self.start_time = time.time()
            
            # Iniciar thread de gravação
            self.recording_thread = threading.Thread(target=self._record_audio)
            self.recording_thread.start()
            
            logger.info("Gravação iniciada")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar gravação: {e}")
            self.is_recording = False
            return False
            
    def stop_recording(self) -> Optional[bytes]:
        """
        Parar gravação e retornar dados - igual ao mobile
        """
        if not self.is_recording:
            logger.warning("Nenhuma gravação em andamento")
            return None
            
        try:
            self.is_recording = False
            
            # Aguardar thread de gravação terminar
            if self.recording_thread:
                self.recording_thread.join(timeout=2.0)
                
            # Verificar duração mínima
            if self.duration < self.MIN_DURATION:
                logger.warning(f"Gravação muito curta: {self.duration}s")
                return None
                
            # Verificar duração máxima
            if self.duration > self.MAX_DURATION:
                logger.warning(f"Gravação muito longa: {self.duration}s")
                return None
                
            # Converter dados para WAV
            wav_data = self._convert_to_wav()
            
            # Verificar tamanho do arquivo
            if len(wav_data) > self.MAX_FILE_SIZE:
                logger.warning(f"Arquivo muito grande: {len(wav_data)} bytes")
                return None
                
            logger.info(f"Gravação finalizada: {self.duration}s, {len(wav_data)} bytes")
            return wav_data
            
        except Exception as e:
            logger.error(f"Erro ao parar gravação: {e}")
            return None
            
    def _record_audio(self):
        """Thread de gravação de áudio"""
        try:
            audio = pyaudio.PyAudio()
            stream = audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )
            
            logger.info("Stream de áudio aberto")
            
            while self.is_recording:
                data = stream.read(self.CHUNK)
                self.audio_data.append(data)
                self.duration = time.time() - self.start_time
                
            # Fechar stream
            stream.stop_stream()
            stream.close()
            audio.terminate()
            
            logger.info("Stream de áudio fechado")
            
        except Exception as e:
            logger.error(f"Erro na thread de gravação: {e}")
            self.is_recording = False
            
    def _convert_to_wav(self) -> bytes:
        """Converter dados de áudio para formato WAV"""
        try:
            # Criar arquivo WAV em memória
            wav_buffer = wave.open('temp.wav', 'wb')
            wav_buffer.setnchannels(self.CHANNELS)
            wav_buffer.setsampwidth(2)  # 16-bit
            wav_buffer.setframerate(self.RATE)
            
            # Escrever dados
            for chunk in self.audio_data:
                wav_buffer.writeframes(chunk)
                
            wav_buffer.close()
            
            # Ler dados do arquivo
            with open('temp.wav', 'rb') as f:
                wav_data = f.read()
                
            # Remover arquivo temporário
            os.remove('temp.wav')
            
            return wav_data
            
        except Exception as e:
            logger.error(f"Erro ao converter para WAV: {e}")
            return b''
            
    def get_duration(self) -> int:
        """Obter duração atual da gravação em segundos"""
        if self.is_recording and self.start_time:
            return int(time.time() - self.start_time)
        return self.duration
        
    def is_recording_active(self) -> bool:
        """Verificar se está gravando"""
        return self.is_recording

class AudioRecorderManager:
    """Gerenciador de gravação de áudio - igual ao mobile"""
    
    def __init__(self, firestore_manager, storage_manager):
        self.firestore_manager = firestore_manager
        self.storage_manager = storage_manager
        self.recorder = AudioRecorder()
        
    def start_recording(self, thread_id: str, on_complete: Callable[[Message], None], on_update: Optional[Callable[[str, Message], None]] = None) -> bool:
        """
        Iniciar gravação de áudio - igual ao mobile
        """
        try:
            if not self.recorder.start_recording():
                return False
                
            # Criar mensagem inicial
            device_id = get_or_create_device_id()
            message = Message(
                id="",  # Será definido pelo Firestore
                threadId=thread_id,
                ownerId=device_id,
                kind=MessageKind.AUDIO,
                source=MessageSource.DESKTOP,
                createdAt=int(datetime.now().timestamp() * 1000),
                payload=MessagePayload(),
                status=MessageStatus.RECORDING
            )
            
            # Salvar mensagem no Firestore
            message_id = self.firestore_manager.save_message(message)
            message.id = message_id
            
            # Notificar callback
            on_complete(message)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar gravação: {e}")
            return False
            
    def stop_recording(self, message: Message, on_update: Optional[Callable[[str, Message], None]] = None) -> bool:
        """
        Parar gravação e processar áudio - igual ao mobile
        """
        try:
            # Parar gravação
            audio_data = self.recorder.stop_recording()
            if not audio_data:
                logger.error("Falha ao obter dados de áudio")
                return False
                
            # Converter para base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Atualizar mensagem com payload de áudio
            audio_payload = AudioPayload(
                base64=audio_base64,
                contentType='audio/wav',
                durationSec=self.recorder.get_duration(),
                sizeBytes=len(audio_data)
            )
            
            # Atualizar status para transcribing
            self.firestore_manager.update_message_status(message.id, MessageStatus.TRANSCRIBING)
            
            # Atualizar payload
            self.firestore_manager.update_message_payload(message.id, {
                'audio': {
                    'base64': audio_payload.base64,
                    'contentType': audio_payload.contentType,
                    'durationSec': audio_payload.durationSec,
                    'sizeBytes': audio_payload.sizeBytes
                }
            })
            
            # Notificar callback se fornecido
            if on_update:
                updated_message = Message(
                    id=message.id,
                    threadId=message.threadId,
                    ownerId=message.ownerId,
                    kind=message.kind,
                    source=message.source,
                    createdAt=message.createdAt,
                    payload=MessagePayload(audio=audio_payload),
                    status=MessageStatus.TRANSCRIBING
                )
                on_update(message.id, updated_message)
                
            logger.info(f"Gravação processada com sucesso: {message.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar gravação: {e}")
            return False
            
    def get_recording_status(self) -> Dict[str, Any]:
        """Obter status da gravação"""
        return {
            'isRecording': self.recorder.is_recording_active(),
            'duration': self.recorder.get_duration()
        }
