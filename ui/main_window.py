from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QSplitter,
    QStackedWidget, QLabel, QVBoxLayout, QFrame
)
from PyQt6.QtCore import Qt, QTimer
from ui.sidebar import Sidebar
from ui.block_editor import BlockEditor
from ui.database_view import DatabaseView
from ui.calendar_view import CalendarView


class WelcomeScreen(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(16)

        logo = QLabel("⬡")
        logo.setStyleSheet("font-size:64px;")
        logo.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title = QLabel("SoftwareNode")
        title.setStyleSheet("font-size:36px; font-weight:bold; color:#89B4FA;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)

        sub = QLabel("Sol panelden bir sayfa seçin veya yeni sayfa oluşturun.")
        sub.setStyleSheet("font-size:15px; color:#6C7086;")
        sub.setAlignment(Qt.AlignmentFlag.AlignCenter)

        hint = QLabel("Editörde '/' yazarak blok ekleyebilirsiniz.\nSağ tıklayarak sayfa oluşturabilirsiniz.")
        hint.setStyleSheet("font-size:13px; color:#45475A;")
        hint.setAlignment(Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(logo)
        layout.addWidget(title)
        layout.addWidget(sub)
        layout.addSpacing(8)
        layout.addWidget(hint)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("SoftwareNode")
        self.resize(1280, 800)
        self.setMinimumSize(800, 600)
        self._build_ui()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root_layout = QHBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # Splitter
        self._splitter = QSplitter(Qt.Orientation.Horizontal)
        self._splitter.setChildrenCollapsible(False)
        root_layout.addWidget(self._splitter)

        # Sidebar
        self._sidebar = Sidebar()
        self._sidebar.page_selected.connect(self._open_page)
        self._splitter.addWidget(self._sidebar)

        # Content area
        self._stack = QStackedWidget()
        self._splitter.addWidget(self._stack)

        self._splitter.setSizes([240, 1040])
        self._splitter.setStretchFactor(0, 0)
        self._splitter.setStretchFactor(1, 1)

        # Pages in stack
        self._welcome = WelcomeScreen()
        self._editor = BlockEditor()
        self._db_view = DatabaseView()
        self._cal_view = CalendarView()

        self._stack.addWidget(self._welcome)   # 0
        self._stack.addWidget(self._editor)    # 1
        self._stack.addWidget(self._db_view)   # 2
        self._stack.addWidget(self._cal_view)  # 3

        self._stack.setCurrentIndex(0)

        # Refresh sidebar periodically to reflect title changes
        self._sidebar_refresh_timer = QTimer()
        self._sidebar_refresh_timer.setSingleShot(True)
        self._sidebar_refresh_timer.timeout.connect(self._delayed_sidebar_refresh)
        self._current_page_id = None

    def _delayed_sidebar_refresh(self):
        if self._current_page_id:
            self._sidebar.refresh(select_id=self._current_page_id)

    def _open_page(self, page_id: int, page_type: str):
        self._current_page_id = page_id
        if page_type == "database":
            self._db_view.load_page(page_id)
            self._stack.setCurrentIndex(2)
        elif page_type == "calendar":
            self._cal_view.load_page(page_id)
            self._stack.setCurrentIndex(3)
        else:
            self._editor.load_page(page_id)
            self._stack.setCurrentIndex(1)
            # Refresh sidebar after 1s to pick up any title change
            self._sidebar_refresh_timer.start(1000)
