"""
Configuração do Firebase para Totari Desktop
Equivalente ao mobile
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Configuração do Firebase - igual ao mobile
firebase_config = {
    "apiKey": os.getenv('FIREBASE_API_KEY', ''),
    "authDomain": os.getenv('FIREBASE_AUTH_DOMAIN', 'totari-real.firebaseapp.com'),
    "projectId": os.getenv('FIREBASE_PROJECT_ID', 'totari-real'),
    "storageBucket": os.getenv('FIREBASE_STORAGE_BUCKET', 'totari-396f8.appspot.com'),
    "messagingSenderId": os.getenv('FIREBASE_MESSAGING_SENDER_ID', ''),
    "appId": os.getenv('FIREBASE_APP_ID', '')
}

# Configurações específicas do desktop
DESKTOP_CONFIG = {
    'poll_interval': int(os.getenv('POLL_INTERVAL', '5')),  # segundos
    'max_audio_duration': int(os.getenv('MAX_AUDIO_DURATION', '1200')),  # 20 minutos
    'min_audio_duration': int(os.getenv('MIN_AUDIO_DURATION', '1')),  # 1 segundo
    'max_file_size': int(os.getenv('MAX_FILE_SIZE', '26214400')),  # 25MB
    'audio_format': os.getenv('AUDIO_FORMAT', 'wav'),
    'audio_sample_rate': int(os.getenv('AUDIO_SAMPLE_RATE', '44100')),
    'audio_channels': int(os.getenv('AUDIO_CHANNELS', '1'))
}
