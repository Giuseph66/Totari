"""
Módulo de funções utilitárias
"""

import os
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def setup_autostart():
    """Configurar inicialização automática no Linux"""
    try:
        # Caminho para o diretório de autostart
        autostart_dir = os.path.expanduser("~/.config/autostart")
        
        # Criar diretório se não existir
        os.makedirs(autostart_dir, exist_ok=True)
        
        # Conteúdo do arquivo .desktop
        desktop_content = """[Desktop Entry]
Type=Application
Name=Totari
Exec=python3 {path}/main.py
Icon=applications-internet
StartupNotify=false
Terminal=false
X-GNOME-Autostart-enabled=true
X-GNOME-Autostart-Delay=2
X-MATE-Autostart-Delay=2
X-KDE-autostart-after=panel
""".format(path=os.getcwd())
        
        # Caminho do arquivo .desktop
        desktop_file_path = os.path.join(autostart_dir, "totari.desktop")
        
        # Escrever arquivo
        with open(desktop_file_path, 'w') as f:
            f.write(desktop_content)
            
        logger.info(f"Autostart configurado: {desktop_file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao configurar autostart: {e}")
        return False
        
def format_date(date_obj):
    """
    Formatar data para exibição
    
    Args:
        date_obj: Objeto datetime
        
    Returns:
        str: Data formatada
    """
    if not date_obj:
        return ""
        
    return date_obj.strftime("%d/%m/%Y %H:%M")
    
def get_message_type_label(message_type):
    """
    Obter rótulo para tipo de mensagem
    
    Args:
        message_type (str): Tipo de mensagem
        
    Returns:
        str: Rótulo formatado
    """
    labels = {
        'audio': 'Áudio',
        'transcript': 'Transcrição',
        'improvement': 'Melhoria'
    }
    
    return labels.get(message_type, message_type)