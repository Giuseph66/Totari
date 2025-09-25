"""
Módulo de interface do usuário com PyQt6
"""

import sys
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QHBoxLayout, QPushButton, QLabel, QLineEdit, 
                            QTextEdit, QListWidget, QListWidgetItem, QStackedWidget,
                            QMessageBox, QFileDialog, QProgressBar)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QObject
from PyQt6.QtGui import QIcon
import logging

from src.firestore import FirestoreManager
from src.notifications import NotificationManager
from src.elevenlabs import ElevenLabsManager
from src.utils import format_date, get_message_type_label

logger = logging.getLogger(__name__)

class UIManager(QMainWindow):
    """Gerenciador de interface do usuário"""
    
    # Sinais
    login_requested = pyqtSignal(str, str)
    register_requested = pyqtSignal(str, str, str)
    logout_requested = pyqtSignal()
    refresh_threads_requested = pyqtSignal()
    refresh_messages_requested = pyqtSignal(str)
    create_thread_requested = pyqtSignal(str)
    delete_thread_requested = pyqtSignal(str)
    start_recording_requested = pyqtSignal(str)
    stop_recording_requested = pyqtSignal(str, bytes)
    generate_audio_requested = pyqtSignal(str, str)
    
    def __init__(self, auth_manager):
        super().__init__()
        
        self.auth_manager = auth_manager
        self.firestore_manager = FirestoreManager(auth_manager)
        self.notification_manager = NotificationManager()
        self.elevenlabs_manager = ElevenLabsManager()
        
        self.current_thread_id = None
        self.threads = []
        self.messages = {}
        
        self._setup_ui()
        
    def _setup_ui(self):
        """Configurar interface do usuário"""
        self.setWindowTitle("Totari")
        self.setGeometry(100, 100, 800, 600)
        
        # Widget central com pilha de views
        self.central_widget = QStackedWidget()
        self.setCentralWidget(self.central_widget)
        
        # Criar views
        self._create_login_view()
        self._create_threads_view()
        self._create_chat_view()
        
        # Mostrar view de threads inicialmente (conversas globais)
        self.show_threads_view()
        
    def _create_login_view(self):
        """Criar view de login"""
        self.login_widget = QWidget()
        layout = QVBoxLayout()
        
        # Título
        title = QLabel("Totari")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("font-size: 24px; font-weight: bold; margin: 20px;")
        layout.addWidget(title)
        
        # Formulário de login
        form_layout = QVBoxLayout()
        
        # Email
        email_label = QLabel("Email:")
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("seu@email.com")
        form_layout.addWidget(email_label)
        form_layout.addWidget(self.email_input)
        
        # Senha
        password_label = QLabel("Senha:")
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("sua senha")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        form_layout.addWidget(password_label)
        form_layout.addWidget(self.password_input)
        
        # Botão de login
        self.login_button = QPushButton("Entrar")
        self.login_button.clicked.connect(self._on_login_clicked)
        form_layout.addWidget(self.login_button)
        
        # Mensagem de erro
        self.login_error_label = QLabel()
        self.login_error_label.setStyleSheet("color: red;")
        self.login_error_label.hide()
        form_layout.addWidget(self.login_error_label)
        
        layout.addLayout(form_layout)
        layout.addStretch()
        
        self.login_widget.setLayout(layout)
        self.central_widget.addWidget(self.login_widget)
        
    def _create_threads_view(self):
        """Criar view de threads"""
        self.threads_widget = QWidget()
        layout = QVBoxLayout()
        
        # Cabeçalho
        header_layout = QHBoxLayout()
        header_label = QLabel("Conversas Globais")
        header_label.setStyleSheet("font-size: 18px; font-weight: bold;")
        header_layout.addWidget(header_label)
        
        self.refresh_threads_button = QPushButton("Atualizar")
        self.refresh_threads_button.clicked.connect(self.refresh_threads_requested.emit)
        header_layout.addWidget(self.refresh_threads_button)
        
        self.login_button_header = QPushButton("Login")
        self.login_button_header.clicked.connect(self.show_login_view)
        header_layout.addWidget(self.login_button_header)
        
        layout.addLayout(header_layout)
        
        # Lista de threads
        self.threads_list = QListWidget()
        self.threads_list.itemClicked.connect(self._on_thread_selected)
        layout.addWidget(self.threads_list)
        
        # Mensagem quando não há threads
        self.no_threads_label = QLabel("Nenhuma conversa encontrada.\nClique em 'Atualizar' para carregar as conversas.")
        self.no_threads_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.no_threads_label.setStyleSheet("color: gray; font-style: italic; padding: 20px;")
        self.no_threads_label.hide()
        layout.addWidget(self.no_threads_label)
        
        # Barra de progresso
        self.threads_progress = QProgressBar()
        self.threads_progress.hide()
        layout.addWidget(self.threads_progress)
        
        self.threads_widget.setLayout(layout)
        self.central_widget.addWidget(self.threads_widget)
        
    def _create_chat_view(self):
        """Criar view de chat"""
        self.chat_widget = QWidget()
        layout = QVBoxLayout()
        
        # Cabeçalho
        header_layout = QHBoxLayout()
        self.back_button = QPushButton("←")
        self.back_button.clicked.connect(self.show_threads_view)
        header_layout.addWidget(self.back_button)
        
        self.chat_title = QLabel("Conversa")
        self.chat_title.setStyleSheet("font-size: 18px; font-weight: bold;")
        header_layout.addWidget(self.chat_title)
        
        self.refresh_chat_button = QPushButton("Atualizar")
        self.refresh_chat_button.clicked.connect(self._on_refresh_chat_clicked)
        header_layout.addWidget(self.refresh_chat_button)
        
        layout.addLayout(header_layout)
        
        # Área de mensagens
        self.messages_list = QListWidget()
        layout.addWidget(self.messages_list)
        
        # Barra de progresso
        self.chat_progress = QProgressBar()
        self.chat_progress.hide()
        layout.addWidget(self.chat_progress)
        
        # Área de geração de áudio (se ElevenLabs estiver habilitado)
        if self.elevenlabs_manager.is_enabled:
            audio_layout = QHBoxLayout()
            self.text_input = QTextEdit()
            self.text_input.setMaximumHeight(100)
            self.text_input.setPlaceholderText("Digite o texto para gerar áudio...")
            audio_layout.addWidget(self.text_input)
            
            self.generate_audio_button = QPushButton("Gerar Áudio")
            self.generate_audio_button.clicked.connect(self._on_generate_audio_clicked)
            audio_layout.addWidget(self.generate_audio_button)
            
            layout.addLayout(audio_layout)
        
        self.chat_widget.setLayout(layout)
        self.central_widget.addWidget(self.chat_widget)
        
    def _on_login_clicked(self):
        """Handler para clique no botão de login"""
        email = self.email_input.text()
        password = self.password_input.text()
        
        if not email or not password:
            self.show_login_error("Por favor, preencha todos os campos")
            return
            
        self.login_button.setEnabled(False)
        self.login_button.setText("Entrando...")
        self.login_error_label.hide()
        
        self.login_requested.emit(email, password)
        
    def _on_thread_selected(self, item):
        """Handler para seleção de thread"""
        thread_id = item.data(Qt.ItemDataRole.UserRole)
        self.open_thread(thread_id)
        
    def _on_refresh_chat_clicked(self):
        """Handler para clique no botão de atualizar chat"""
        if self.current_thread_id:
            self.refresh_messages_requested.emit(self.current_thread_id)
            
    def _on_generate_audio_clicked(self):
        """Handler para clique no botão de gerar áudio"""
        if not self.current_thread_id:
            return
            
        text = self.text_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Aviso", "Por favor, digite algum texto")
            return
            
        self.generate_audio_button.setEnabled(False)
        self.generate_audio_button.setText("Gerando...")
        
        self.generate_audio_requested.emit(self.current_thread_id, text)
        
    def show_login_view(self):
        """Mostrar view de login"""
        self.central_widget.setCurrentWidget(self.login_widget)
        self.email_input.setFocus()
        
    def show_threads_view(self):
        """Mostrar view de threads"""
        self.central_widget.setCurrentWidget(self.threads_widget)
        self.current_thread_id = None
        self.refresh_threads_requested.emit()
        
    def show_chat_view(self, thread_id, thread_title):
        """Mostrar view de chat"""
        self.current_thread_id = thread_id
        self.chat_title.setText(thread_title)
        self.central_widget.setCurrentWidget(self.chat_widget)
        self.messages_list.clear()
        
        # Limpar input de texto se ElevenLabs estiver habilitado
        if self.elevenlabs_manager.is_enabled:
            self.text_input.clear()
            self.generate_audio_button.setEnabled(True)
            self.generate_audio_button.setText("Gerar Áudio")
            
    def show_login_error(self, message):
        """Mostrar mensagem de erro de login"""
        self.login_error_label.setText(message)
        self.login_error_label.show()
        self.login_button.setEnabled(True)
        self.login_button.setText("Entrar")
        
    def clear_login_error(self):
        """Limpar mensagem de erro de login"""
        self.login_error_label.hide()
        self.login_button.setEnabled(True)
        self.login_button.setText("Entrar")
        
    def show_threads_progress(self, show=True):
        """Mostrar/ocultar barra de progresso de threads"""
        if show:
            self.threads_progress.show()
        else:
            self.threads_progress.hide()
            
    def show_chat_progress(self, show=True):
        """Mostrar/ocultar barra de progresso de chat"""
        if show:
            self.chat_progress.show()
        else:
            self.chat_progress.hide()
            
    def update_threads(self, threads):
        """Atualizar lista de threads"""
        logger.info(f"UI: Atualizando threads - {len(threads) if threads else 0} threads recebidas")
        self.threads = threads
        self.threads_list.clear()
        
        if threads and len(threads) > 0:
            # Ocultar mensagem de "nenhuma conversa"
            self.no_threads_label.hide()
            
            for thread in threads:
                item = QListWidgetItem()
                # Formatar data manualmente para evitar erro com timestamp Unix
                from datetime import datetime
                timestamp = thread['updatedAt'] / 1000  # Converter de ms para s
                date_str = datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y %H:%M")
                item.setText(f"{thread['title']}\n{date_str}")
                item.setData(Qt.ItemDataRole.UserRole, thread['id'])
                self.threads_list.addItem(item)
            logger.info(f"UI: {len(threads)} threads exibidas na interface")
        else:
            # Mostrar mensagem de "nenhuma conversa"
            self.no_threads_label.show()
            logger.info("UI: Nenhuma thread encontrada - exibindo mensagem informativa")
            
    def update_messages(self, thread_id, messages):
        """Atualizar lista de mensagens"""
        self.messages[thread_id] = messages
        self.messages_list.clear()
        
        for message in messages:
            item = QListWidgetItem()
            
            if message['kind'] == 'audio':
                item.setText(f"🎵 Áudio ({format_date(message['createdAt'])})\nDuração: {message.get('duration', 0)}s")
            elif message['kind'] == 'transcript':
                item.setText(f"📝 {message['text']}\n({format_date(message['createdAt'])})")
            elif message['kind'] == 'improvement':
                item.setText(f"✨ Melhoria: {message['improvedText']}\n({format_date(message['createdAt'])})")
                
            item.setData(Qt.ItemDataRole.UserRole, message['id'])
            self.messages_list.addItem(item)
            
    def open_thread(self, thread_id):
        """Abrir thread"""
        # Encontrar título da thread
        thread_title = thread_id
        for thread in self.threads:
            if thread['id'] == thread_id:
                thread_title = thread['title']
                break
                
        self.show_chat_view(thread_id, thread_title)
        self.refresh_messages_requested.emit(thread_id)
        
    def show_audio_generated_success(self):
        """Mostrar mensagem de sucesso na geração de áudio"""
        if self.elevenlabs_manager.is_enabled:
            self.generate_audio_button.setEnabled(True)
            self.generate_audio_button.setText("Gerar Áudio")
            self.text_input.clear()
            QMessageBox.information(self, "Sucesso", "Áudio gerado com sucesso!")
            
    def show_audio_generated_error(self, error_message):
        """Mostrar mensagem de erro na geração de áudio"""
        if self.elevenlabs_manager.is_enabled:
            self.generate_audio_button.setEnabled(True)
            self.generate_audio_button.setText("Gerar Áudio")
            QMessageBox.critical(self, "Erro", f"Erro ao gerar áudio: {error_message}")
            
    def show_error(self, message):
        """Mostrar erro genérico"""
        QMessageBox.warning(self, "Erro", message)
        
    def clear_login_error(self):
        """Limpar erro de login"""
        pass  # Implementar se necessário