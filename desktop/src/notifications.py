"""
Módulo para notificações nativas
"""

from plyer import notification
import logging

logger = logging.getLogger(__name__)

class NotificationManager:
    """Gerenciador de notificações nativas"""
    
    def __init__(self):
        pass
        
    def show_notification(self, title: str, message: str, timeout: int = 5):
        """
        Mostrar notificação nativa
        
        Args:
            title (str): Título da notificação
            message (str): Mensagem da notificação
            timeout (int): Tempo de exibição em segundos
        """
        try:
            notification.notify(
                title=title,
                message=message,
                app_name="Totari",
                timeout=timeout
            )
            logger.info(f"Notificação mostrada: {title} - {message}")
        except Exception as e:
            logger.error(f"Erro ao mostrar notificação: {e}")
            
    def show_message_notification(self, thread_title: str, message_type: str):
        """
        Mostrar notificação de nova mensagem
        
        Args:
            thread_title (str): Título da thread
            message_type (str): Tipo de mensagem (transcript, improvement, etc.)
        """
        type_labels = {
            'transcript': 'Transcrição',
            'improvement': 'Melhoria',
            'audio': 'Áudio'
        }
        
        message_type_label = type_labels.get(message_type, message_type)
        title = f"Nova mensagem em {thread_title}"
        message = f"Novo {message_type_label} disponível"
        
        self.show_notification(title, message)