"""
Módulo para ícone de bandeja (tray) e menu
"""

import sys
from PyQt6.QtWidgets import QSystemTrayIcon, QMenu, QApplication
from PyQt6.QtGui import QIcon, QAction
from PyQt6.QtCore import QObject, pyqtSignal
import logging

logger = logging.getLogger(__name__)

class TrayIcon(QSystemTrayIcon):
    """Ícone de bandeja com menu para Totari Desktop"""
    
    # Sinais
    open_app_requested = pyqtSignal()
    pause_sync_requested = pyqtSignal()
    exit_requested = pyqtSignal()
    
    def __init__(self, auth_manager, parent=None):
        super().__init__(parent)
        
        self.auth_manager = auth_manager
        self.is_sync_paused = False
        
        # Configurar ícone (usar um ícone padrão por enquanto)
        self.setIcon(QIcon.fromTheme("applications-internet"))
        
        # Criar menu
        self._create_menu()
        
        # Conectar sinais
        self.activated.connect(self._on_activated)
        
    def _create_menu(self):
        """Criar menu do ícone de bandeja"""
        self.menu = QMenu()
        
        # Ação Abrir
        self.open_action = QAction("Abrir", self.menu)
        self.open_action.triggered.connect(self._on_open)
        self.menu.addAction(self.open_action)
        
        # Ação Pausar sincronização
        self.pause_action = QAction("Pausar sincronização", self.menu)
        self.pause_action.triggered.connect(self._on_pause_sync)
        self.menu.addAction(self.pause_action)
        
        # Separador
        self.menu.addSeparator()
        
        # Ação Sair
        self.exit_action = QAction("Sair", self.menu)
        self.exit_action.triggered.connect(self._on_exit)
        self.menu.addAction(self.exit_action)
        
        self.setContextMenu(self.menu)
        
    def _on_activated(self, reason):
        """Handler para clique no ícone de bandeja"""
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            # Clique esquerdo - abrir aplicação
            self._on_open()
        
    def _on_open(self):
        """Handler para ação Abrir"""
        logger.info("Abrir aplicação solicitado")
        self.open_app_requested.emit()
        
    def _on_pause_sync(self):
        """Handler para ação Pausar sincronização"""
        self.is_sync_paused = not self.is_sync_paused
        
        if self.is_sync_paused:
            self.pause_action.setText("Retomar sincronização")
            logger.info("Sincronização pausada")
        else:
            self.pause_action.setText("Pausar sincronização")
            logger.info("Sincronização retomada")
            
        self.pause_sync_requested.emit()
        
    def _on_exit(self):
        """Handler para ação Sair"""
        logger.info("Saída solicitada")
        self.exit_requested.emit()
        
    def show_message(self, title, message, icon=QSystemTrayIcon.MessageIcon.Information, timeout=5000):
        """Mostrar mensagem de notificação"""
        self.showMessage(title, message, icon, timeout)