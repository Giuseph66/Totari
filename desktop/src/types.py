"""
Tipos e estruturas de dados para o Totari Desktop
Equivalente aos tipos TypeScript do mobile
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class MessageKind(Enum):
    """Tipos de mensagem"""
    AUDIO = "audio"
    TRANSCRIPT = "transcript"
    IMPROVEMENT = "improvement"
    NOTE = "note"
    SYSTEM = "system"

class MessageStatus(Enum):
    """Status das mensagens"""
    PENDING = "pending"
    RECORDING = "recording"
    TRANSCRIBING = "transcribing"
    TRANSCRIBED = "transcribed"
    IMPROVED = "improved"
    ERROR = "error"

class MessageSource(Enum):
    """Origem da mensagem"""
    MOBILE = "mobile"
    DESKTOP = "desktop"
    SERVER = "server"

@dataclass
class AudioPayload:
    """Payload de áudio"""
    base64: str
    contentType: str
    durationSec: int
    sizeBytes: int

@dataclass
class WordTiming:
    """Timing de palavras na transcrição"""
    start: float
    end: float
    word: str

@dataclass
class TranscriptPayload:
    """Payload de transcrição"""
    text: str
    words: Optional[List[WordTiming]] = None
    languageCode: Optional[str] = None
    confidence: Optional[float] = None

@dataclass
class ImprovementPayload:
    """Payload de melhoria de texto"""
    texto_melhorado: str
    topicos: List[str]
    insights: List[str]
    resumo: str

@dataclass
class NotePayload:
    """Payload de nota"""
    text: str

@dataclass
class MessagePayload:
    """Payload completo da mensagem"""
    audio: Optional[AudioPayload] = None
    transcript: Optional[TranscriptPayload] = None
    improvement: Optional[ImprovementPayload] = None
    note: Optional[NotePayload] = None

@dataclass
class Message:
    """Estrutura de mensagem"""
    id: str
    threadId: str
    ownerId: str
    kind: MessageKind
    source: MessageSource
    createdAt: int
    payload: MessagePayload
    status: Optional[MessageStatus] = None
    error: Optional[str] = None

@dataclass
class User:
    """Estrutura de usuário"""
    id: str
    email: str
    displayName: str
    createdAt: int

@dataclass
class Thread:
    """Estrutura de thread"""
    id: str
    ownerId: str
    title: str
    createdAt: int
    updatedAt: int

@dataclass
class AuthResponse:
    """Resposta de autenticação"""
    token: str
    user: User

# Tipos para compatibilidade com Firestore
def message_to_dict(message: Message) -> Dict[str, Any]:
    """Converter Message para dicionário para Firestore"""
    return {
        'id': message.id,
        'threadId': message.threadId,
        'ownerId': message.ownerId,
        'kind': message.kind.value,
        'source': message.source.value,
        'createdAt': message.createdAt,
        'payload': {
            'audio': {
                'base64': message.payload.audio.base64,
                'contentType': message.payload.audio.contentType,
                'durationSec': message.payload.audio.durationSec,
                'sizeBytes': message.payload.audio.sizeBytes
            } if message.payload.audio else None,
            'transcript': {
                'text': message.payload.transcript.text,
                'words': [
                    {
                        'start': word.start,
                        'end': word.end,
                        'word': word.word
                    } for word in message.payload.transcript.words
                ] if message.payload.transcript and message.payload.transcript.words else None,
                'languageCode': message.payload.transcript.languageCode,
                'confidence': message.payload.transcript.confidence
            } if message.payload.transcript else None,
            'improvement': {
                'texto_melhorado': message.payload.improvement.texto_melhorado,
                'topicos': message.payload.improvement.topicos,
                'insights': message.payload.improvement.insights,
                'resumo': message.payload.improvement.resumo
            } if message.payload.improvement else None,
            'note': {
                'text': message.payload.note.text
            } if message.payload.note else None
        },
        'status': message.status.value if message.status else None,
        'error': message.error
    }

def message_from_dict(data: Dict[str, Any]) -> Message:
    """Converter dicionário do Firestore para Message"""
    # Converter payload
    payload_data = data.get('payload', {})
    payload = MessagePayload()
    
    if payload_data.get('audio'):
        audio_data = payload_data['audio']
        payload.audio = AudioPayload(
            base64=audio_data['base64'],
            contentType=audio_data['contentType'],
            durationSec=audio_data['durationSec'],
            sizeBytes=audio_data['sizeBytes']
        )
    
    if payload_data.get('transcript'):
        transcript_data = payload_data['transcript']
        words = None
        if transcript_data.get('words'):
            words = [
                WordTiming(
                    start=word['start'],
                    end=word['end'],
                    word=word['word']
                ) for word in transcript_data['words']
            ]
        
        payload.transcript = TranscriptPayload(
            text=transcript_data['text'],
            words=words,
            languageCode=transcript_data.get('languageCode'),
            confidence=transcript_data.get('confidence')
        )
    
    if payload_data.get('improvement'):
        improvement_data = payload_data['improvement']
        payload.improvement = ImprovementPayload(
            texto_melhorado=improvement_data['texto_melhorado'],
            topicos=improvement_data['topicos'],
            insights=improvement_data['insights'],
            resumo=improvement_data['resumo']
        )
    
    if payload_data.get('note'):
        note_data = payload_data['note']
        payload.note = NotePayload(text=note_data['text'])
    
    return Message(
        id=data['id'],
        threadId=data['threadId'],
        ownerId=data['ownerId'],
        kind=MessageKind(data['kind']),
        source=MessageSource(data['source']),
        createdAt=data['createdAt'],
        payload=payload,
        status=MessageStatus(data['status']) if data.get('status') else None,
        error=data.get('error')
    )

def thread_to_dict(thread: Thread) -> Dict[str, Any]:
    """Converter Thread para dicionário para Firestore"""
    return {
        'id': thread.id,
        'ownerId': thread.ownerId,
        'title': thread.title,
        'createdAt': thread.createdAt,
        'updatedAt': thread.updatedAt
    }

def thread_from_dict(data: Dict[str, Any]) -> Thread:
    """Converter dicionário do Firestore para Thread"""
    return Thread(
        id=data['id'],
        ownerId=data['ownerId'],
        title=data['title'],
        createdAt=data['createdAt'],
        updatedAt=data['updatedAt']
    )
