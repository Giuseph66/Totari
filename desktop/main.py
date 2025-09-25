#!/usr/bin/env python3
"""
Totari Desktop - Versão Simplificada
Baseada no teste que funcionou
"""

import sys
import os
import logging
from PyQt6.QtWidgets import (QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget, 
                            QListWidget, QListWidgetItem, QHBoxLayout, QPushButton, 
                            QStackedWidget, QTextEdit, QMessageBox, QInputDialog)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QIcon, QClipboard

# Configurar variável de ambiente
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/jesus/Progetos/Totari/desktop/totari-real-firebase-adminsdk-fbsvc-9dab005a86.json'

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from src.firestore import FirestoreManager
from src.tray import TrayIcon

class TotariSimpleApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Totari - Conversas Globais")
        self.setGeometry(100, 100, 900, 700)
        
        # Aplicar estilo geral à aplicação
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QPushButton {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 13px;
            }
            QPushButton:hover {
                background-color: #0056b3;
            }
            QPushButton:pressed {
                background-color: #004085;
            }
            QPushButton:disabled {
                background-color: #6c757d;
                color: #adb5bd;
            }
            QLabel {
                color: #333;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
        """)
        
        # Inicializar manager
        self.firestore_manager = FirestoreManager()
        
        # Configurar aplicação para não fechar quando fechar janela
        self.app = QApplication.instance()
        self.app.setQuitOnLastWindowClosed(False)
        
        # Widget central com pilha de views
        self.central_widget = QStackedWidget()
        self.setCentralWidget(self.central_widget)
        
        # Criar views
        self.create_threads_view()
        self.create_messages_view()
        
        # Mostrar view de threads inicialmente
        self.central_widget.setCurrentWidget(self.threads_widget)
        
        # Configurar ícone na bandeja
        self.tray_icon = TrayIcon(None)  # Passar None para auth_manager
        self.tray_icon.open_app_requested.connect(self.show)
        self.tray_icon.exit_requested.connect(self.quit_app)
        self.tray_icon.show()
        
        # Carregar threads automaticamente
        self.load_threads()
        
    def create_threads_view(self):
        """Criar view de threads"""
        self.threads_widget = QWidget()
        layout = QVBoxLayout()
        
        # Cabeçalho
        header_layout = QHBoxLayout()
        title_label = QLabel("Conversas Globais")
        title_label.setStyleSheet("font-size: 18px; font-weight: bold;")
        header_layout.addWidget(title_label)
        
        refresh_button = QPushButton("Atualizar")
        refresh_button.clicked.connect(self.load_threads)
        header_layout.addWidget(refresh_button)
        
        layout.addLayout(header_layout)
        
        # Lista de threads
        self.threads_list = QListWidget()
        self.threads_list.itemClicked.connect(self.on_thread_selected)
        
        # Configurar para suportar HTML
        self.threads_list.setWordWrap(True)
        self.threads_list.setSpacing(4)
        
        # Estilizar a lista de threads
        self.threads_list.setStyleSheet("""
            QListWidget {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 8px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                color: #333;
            }
            QListWidget::item {
                background-color: white;
                border: 1px solid #dee2e6;
                border-radius: 12px;
                padding: 16px;
                margin: 6px 0px;
                min-height: 30px;
                line-height: 1.4;
                color: #333;
            }
            QListWidget::item:hover {
                background-color: #e3f2fd;
                border-color: #2196f3;
                color: #333;
            }
            QListWidget::item:selected {
                background-color: #bbdefb;
                border-color: #1976d2;
                color: #333;
            }
        """)
        
        layout.addWidget(self.threads_list)
        
        # Mensagem quando não há threads
        self.no_threads_label = QLabel("Nenhuma conversa encontrada.\nClique em 'Atualizar' para carregar as conversas.")
        self.no_threads_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.no_threads_label.setStyleSheet("color: gray; font-style: italic; padding: 20px;")
        self.no_threads_label.hide()
        layout.addWidget(self.no_threads_label)
        
        self.threads_widget.setLayout(layout)
        self.central_widget.addWidget(self.threads_widget)
        
    def create_messages_view(self):
        """Criar view de mensagens"""
        self.messages_widget = QWidget()
        layout = QVBoxLayout()
        
        # Cabeçalho
        header_layout = QHBoxLayout()
        back_button = QPushButton("← Voltar")
        back_button.clicked.connect(self.show_threads_view)
        header_layout.addWidget(back_button)
        
        self.messages_title = QLabel("Mensagens")
        self.messages_title.setStyleSheet("font-size: 18px; font-weight: bold;")
        header_layout.addWidget(self.messages_title)
        
        # Botões de clipboard
        self.copy_button = QPushButton("📋 Copiar")
        self.copy_button.clicked.connect(self.copy_selected_message)
        self.copy_button.setEnabled(False)
        header_layout.addWidget(self.copy_button)
        
        self.paste_button = QPushButton("📥 Colar")
        self.paste_button.clicked.connect(self.paste_message)
        header_layout.addWidget(self.paste_button)
        
        refresh_button = QPushButton("Atualizar")
        refresh_button.clicked.connect(self.load_messages)
        header_layout.addWidget(refresh_button)
        
        layout.addLayout(header_layout)
        
        # Lista de mensagens
        self.messages_list = QListWidget()
        self.messages_list.itemClicked.connect(self.on_message_selected)
        self.messages_list.itemSelectionChanged.connect(self.on_message_selection_changed)
        
        # Configurar para suportar HTML
        self.messages_list.setWordWrap(True)
        self.messages_list.setSpacing(8)
        
        # Configurar para suportar HTML adequadamente
        from PyQt6.QtCore import Qt
        from PyQt6.QtWidgets import QStyledItemDelegate
        from PyQt6.QtGui import QTextDocument, QTextOption
        
        # Estilizar a lista de mensagens
        self.messages_list.setStyleSheet("""
            QListWidget {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 8px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                color: #333;
            }
            QListWidget::item {
                background-color: white;
                border: 1px solid #dee2e6;
                border-radius: 12px;
                padding: 16px;
                margin: 6px 0px;
                min-height: 30px;
                line-height: 1.4;
                color: #333;
            }
            QListWidget::item:hover {
                background-color: #e3f2fd;
                border-color: #2196f3;
                color: #333;
            }
            QListWidget::item:selected {
                background-color: #bbdefb;
                border-color: #1976d2;
                color: #333;
            }
        """)
        
        layout.addWidget(self.messages_list)
        
        # Mensagem quando não há mensagens
        self.no_messages_label = QLabel("Nenhuma mensagem encontrada.")
        self.no_messages_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.no_messages_label.setStyleSheet("color: gray; font-style: italic; padding: 20px;")
        self.no_messages_label.hide()
        layout.addWidget(self.no_messages_label)
        
        self.messages_widget.setLayout(layout)
        self.central_widget.addWidget(self.messages_widget)
        
    def load_threads(self):
        """Carregar threads do Firestore"""
        try:
            logger.info("Carregando threads...")
            threads = self.firestore_manager.get_threads()
            logger.info(f"Threads encontradas: {len(threads)}")
            
            self.threads_list.clear()
            
            if threads and len(threads) > 0:
                self.no_threads_label.hide()
                
                for thread in threads:
                    item = QListWidgetItem()
                    # Formatar data manualmente
                    from datetime import datetime
                    timestamp = thread.updatedAt / 1000  # Converter de ms para s
                    date_str = datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y %H:%M")
                    
                    # Usar texto simples com formatação visual
                    item.setText(f"📝 {thread.title}\n{date_str}")
                    item.setData(Qt.ItemDataRole.UserRole, thread.id)
                    self.threads_list.addItem(item)
                    
                logger.info(f"Exibindo {len(threads)} threads na interface")
            else:
                self.no_threads_label.show()
                logger.info("Nenhuma thread encontrada")
                
        except Exception as e:
            logger.error(f"Erro ao carregar threads: {e}")
            self.no_threads_label.show()
            
    def on_thread_selected(self, item):
        """Handler para seleção de thread"""
        self.current_thread_id = item.data(Qt.ItemDataRole.UserRole)
        thread_title = item.text().split('\n')[0]  # Pegar apenas o título
        logger.info(f"Thread selecionada: {thread_title} ({self.current_thread_id})")
        
        # Atualizar título e mostrar mensagens
        self.messages_title.setText(f"Mensagens - {thread_title}")
        self.central_widget.setCurrentWidget(self.messages_widget)
        self.load_messages()
        
    def show_threads_view(self):
        """Voltar para view de threads"""
        self.central_widget.setCurrentWidget(self.threads_widget)
        
    def load_messages(self):
        """Carregar mensagens da thread atual"""
        if not hasattr(self, 'current_thread_id') or not self.current_thread_id:
            return
            
        try:
            logger.info(f"Carregando mensagens da thread {self.current_thread_id}...")
            messages = self.firestore_manager.get_messages(self.current_thread_id)
            logger.info(f"Mensagens encontradas: {len(messages)}")
            
            self.messages_list.clear()
            
            if messages and len(messages) > 0:
                self.no_messages_label.hide()
                
                # Ordenar mensagens por data de criação
                sorted_messages = sorted(messages, key=lambda x: x.createdAt)
                
                for message in sorted_messages:
                    item = QListWidgetItem()
                    
                    # Debug: mostrar informações da mensagem
                    logger.info(f"Processando mensagem: kind={message.kind.value}, payload={message.payload}")
                    
                    # Formatar data
                    from datetime import datetime
                    timestamp = message.createdAt / 1000
                    date_str = datetime.fromtimestamp(timestamp).strftime("%H:%M")
                    
                    # Formatar conteúdo da mensagem como chat
                    if message.kind.value == 'transcript':
                        text = getattr(message.payload.transcript, 'text', '') if message.payload.transcript else ''
                        content = f"💬 Transcrição\n{text}\n\n{date_str}"
                        logger.info(f"Transcrição: {text}")
                    elif message.kind.value == 'improvement':
                        text = getattr(message.payload.improvement, 'texto_melhorado', '') if message.payload.improvement else ''
                        content = f"✨ Melhoria\n{text}\n\n{date_str}"
                        logger.info(f"Melhoria: {text}")
                    elif message.kind.value == 'audio':
                        # Para áudios, tentar mostrar a transcrição se existir
                        transcript_text = getattr(message.payload.transcript, 'text', '') if message.payload.transcript else ''
                        duration = getattr(message.payload.audio, 'durationSec', 0) if message.payload.audio else 0
                        logger.info(f"Áudio - transcrição: {transcript_text}, duração: {duration}")
                        if transcript_text:
                            content = f"🎵 Áudio\n{transcript_text}\n\n{date_str}"
                        else:
                            content = f"🎵 Áudio ({duration:.1f}s)\n\n{date_str}"
                    elif message.kind.value == 'note':
                        # Para notas, mostrar o texto da nota
                        note_text = getattr(message.payload.note, 'text', '') if message.payload.note else ''
                        logger.info(f"Nota: {note_text[:100]}...")
                        if note_text:
                            # Limitar o texto para não ficar muito longo na lista
                            preview = note_text[:200] + "..." if len(note_text) > 200 else note_text
                            content = f"📝 Nota\n{preview}\n\n{date_str}"
                        else:
                            content = f"📝 Nota vazia\n\n{date_str}"
                    else:
                        content = f"📄 {message.kind.value.title()}\n\n{date_str}"
                        logger.info(f"Tipo desconhecido: {message.kind.value}")
                    
                    logger.info(f"Conteúdo final: {content}")
                    item.setText(content)
                    self.messages_list.addItem(item)
                    
                logger.info(f"Exibindo {len(messages)} mensagens na interface")
            else:
                self.no_messages_label.show()
                logger.info("Nenhuma mensagem encontrada")
                
        except Exception as e:
            logger.error(f"Erro ao carregar mensagens: {e}")
            self.no_messages_label.show()
            
    def on_message_selected(self, item):
        """Handler para seleção de mensagem"""
        text = item.text()
        logger.info(f"Mensagem selecionada: {text[:100]}...")
        
        if "🎵" in text:
            logger.info("Áudio selecionado - funcionalidade de reprodução será implementada")
            QMessageBox.information(self, "Áudio", "Funcionalidade de reprodução de áudio será implementada em breve!")
        elif "📝" in text:
            logger.info("Nota selecionada - mostrando conteúdo completo")
            # Extrair o texto da nota (remover emoji e timestamp)
            note_content = text.replace("📝 ", "").split("\n\n")[0]
            QMessageBox.information(self, "Nota Completa", note_content)
        else:
            logger.info("Mensagem de texto selecionada")
    
    def on_message_selection_changed(self):
        """Handler para mudança de seleção de mensagem"""
        # Habilitar/desabilitar botão de copiar baseado na seleção
        has_selection = self.messages_list.currentItem() is not None
        self.copy_button.setEnabled(has_selection)
    
    def copy_selected_message(self):
        """Copiar mensagem selecionada para o clipboard"""
        current_item = self.messages_list.currentItem()
        if current_item:
            text = current_item.text()
            # Remover emojis e timestamps para uma cópia mais limpa
            clean_text = self.clean_message_text(text)
            
            clipboard = QApplication.clipboard()
            clipboard.setText(clean_text)
            
            logger.info(f"Mensagem copiada para clipboard: {clean_text[:100]}...")
            QMessageBox.information(self, "Copiado", "Mensagem copiada para o clipboard!")
        else:
            QMessageBox.warning(self, "Erro", "Nenhuma mensagem selecionada!")
    
    def paste_message(self):
        """Colar mensagem do clipboard"""
        clipboard = QApplication.clipboard()
        text = clipboard.text()
        
        if text.strip():
            # Mostrar diálogo para confirmar a colagem
            reply = QMessageBox.question(self, "Colar Mensagem", 
                                       f"Deseja colar a seguinte mensagem?\n\n{text[:200]}{'...' if len(text) > 200 else ''}",
                                       QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
            
            if reply == QMessageBox.StandardButton.Yes:
                # Aqui você pode implementar a lógica para salvar a mensagem colada
                # Por enquanto, apenas mostra uma mensagem de confirmação
                logger.info(f"Mensagem colada do clipboard: {text[:100]}...")
                QMessageBox.information(self, "Colado", "Mensagem colada com sucesso!\n\nNota: A funcionalidade de salvar mensagens coladas será implementada em breve.")
        else:
            QMessageBox.warning(self, "Erro", "Clipboard vazio!")
    
    def clean_message_text(self, text):
        """Limpar texto da mensagem removendo emojis e timestamps"""
        # Remover emojis comuns
        emojis = ["💬", "✨", "🎵", "📝", "📄"]
        for emoji in emojis:
            text = text.replace(emoji, "")
        
        # Remover timestamp (última linha que contém horário)
        lines = text.split('\n')
        if len(lines) > 1:
            # Verificar se a última linha é um timestamp (formato HH:MM)
            last_line = lines[-1].strip()
            if len(last_line) <= 5 and ':' in last_line and last_line.replace(':', '').replace(' ', '').isdigit():
                lines = lines[:-1]
        
        return '\n'.join(lines).strip()
            
    def quit_app(self):
        """Sair da aplicação"""
        logger.info("Saindo do Totari Desktop")
        self.app.quit()

def main():
    """Ponto de entrada principal"""
    try:
        app = QApplication(sys.argv)
        window = TotariSimpleApp()
        window.show()
        return app.exec()
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())