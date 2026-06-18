from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit, QLineEdit,
    QPushButton, QLabel, QFrame, QMenu, QSizePolicy, QScrollArea,
    QCheckBox, QCompleter
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer, QSize
from PyQt6.QtGui import QFont, QKeyEvent, QAction, QTextCursor
from database.db import get_blocks, save_blocks, get_page, update_page


BLOCK_TYPES = {
    "text":     ("📝 Metin",         "Düz metin"),
    "h1":       ("H1 Başlık",        "Büyük başlık"),
    "h2":       ("H2 Başlık",        "Orta başlık"),
    "h3":       ("H3 Başlık",        "Küçük başlık"),
    "bullet":   ("• Madde listesi",  "Maddeli liste"),
    "numbered": ("1. Numaralı liste","Numaralı liste"),
    "todo":     ("☐ Yapılacak",      "Onay kutusu"),
    "code":     ("</> Kod",          "Kod bloğu"),
    "divider":  ("— Ayırıcı",        "Yatay çizgi"),
    "quote":    ("❝ Alıntı",         "Blok alıntı"),
}


class DividerBlock(QFrame):
    remove_requested = pyqtSignal(object)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.Shape.HLine)
        self.setFrameShadow(QFrame.Shadow.Sunken)
        self.setStyleSheet("color:#45475A; background-color:#45475A; max-height:1px; margin:8px 0;")
        self.setFixedHeight(1)

    def get_data(self):
        return {"type": "divider", "content": "", "properties": {}}


class TodoBlock(QWidget):
    remove_requested = pyqtSignal(object)
    content_changed = pyqtSignal()

    def __init__(self, content="", checked=False, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 2, 0, 2)
        self.checkbox = QCheckBox()
        self.checkbox.setChecked(checked)
        self.checkbox.stateChanged.connect(self._on_change)
        self.edit = QLineEdit(content)
        self.edit.setStyleSheet(
            "background:transparent; border:none; color:#CDD6F4; font-size:14px;"
        )
        self.edit.textChanged.connect(self.content_changed.emit)
        layout.addWidget(self.checkbox)
        layout.addWidget(self.edit)

    def _on_change(self):
        checked = self.checkbox.isChecked()
        color = "#6C7086" if checked else "#CDD6F4"
        deco = "line-through" if checked else "none"
        self.edit.setStyleSheet(
            f"background:transparent; border:none; color:{color}; "
            f"font-size:14px; text-decoration:{deco};"
        )
        self.content_changed.emit()

    def get_data(self):
        return {
            "type": "todo",
            "content": self.edit.text(),
            "properties": {"checked": self.checkbox.isChecked()}
        }


class TextBlock(QTextEdit):
    remove_requested = pyqtSignal(object)
    add_block_below = pyqtSignal(object, str)
    move_focus = pyqtSignal(object, int)  # (self, direction: -1/+1)
    content_changed = pyqtSignal()

    STYLE_MAP = {
        "text":     ("14px", "normal", "#CDD6F4", ""),
        "h1":       ("28px", "bold",   "#CDD6F4", ""),
        "h2":       ("22px", "bold",   "#BAC2DE", ""),
        "h3":       ("18px", "bold",   "#A6ADC8", ""),
        "bullet":   ("14px", "normal", "#CDD6F4", "• "),
        "numbered": ("14px", "normal", "#CDD6F4", ""),
        "code":     ("13px", "normal", "#A6E3A1", ""),
        "quote":    ("14px", "normal", "#A6ADC8", ""),
    }

    def __init__(self, block_type="text", content="", parent=None):
        super().__init__(parent)
        self.block_type = block_type
        self.setAcceptRichText(False)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.document().contentsChanged.connect(self._adjust_height)
        self.document().contentsChanged.connect(self.content_changed.emit)
        self._apply_style()
        self.setPlainText(content)
        self._adjust_height()

        if block_type == "code":
            self.setObjectName("codeBlock")
            self.setStyleSheet(
                "background-color:#181825; color:#A6E3A1; "
                "font-family:'Fira Code','Courier New',monospace; "
                "border-radius:6px; padding:8px; font-size:13px;"
            )
        elif block_type == "quote":
            self.setStyleSheet(
                "border-left: 3px solid #89B4FA; padding-left:12px; "
                "color:#A6ADC8; background:transparent; border-top:none; "
                "border-right:none; border-bottom:none;"
            )

    def _apply_style(self):
        size, weight, color, _ = self.STYLE_MAP.get(self.block_type, self.STYLE_MAP["text"])
        self.setStyleSheet(
            f"font-size:{size}; font-weight:{weight}; color:{color}; "
            "background:transparent; border:none;"
        )

    def _adjust_height(self):
        doc_h = int(self.document().size().height())
        self.setFixedHeight(max(doc_h + 4, 28))

    def keyPressEvent(self, e: QKeyEvent):
        key = e.key()
        text = self.toPlainText()

        # Enter → new block
        if key == Qt.Key.Key_Return and not e.modifiers():
            self.add_block_below.emit(self, "text")
            return

        # Backspace on empty → remove
        if key == Qt.Key.Key_Backspace and not text:
            self.remove_requested.emit(self)
            return

        # Arrow up/down between blocks
        cursor = self.textCursor()
        if key == Qt.Key.Key_Up and cursor.blockNumber() == 0:
            self.move_focus.emit(self, -1)
            return
        if key == Qt.Key.Key_Down:
            last = self.document().blockCount() - 1
            if cursor.blockNumber() == last:
                self.move_focus.emit(self, +1)
                return

        # Markdown shortcuts
        if key in (Qt.Key.Key_Space,):
            if text == "#":
                self.clear()
                self.add_block_below.emit(self, "h1")
                self.remove_requested.emit(self)
                return
            if text == "##":
                self.clear()
                self.add_block_below.emit(self, "h2")
                self.remove_requested.emit(self)
                return
            if text == "###":
                self.clear()
                self.add_block_below.emit(self, "h3")
                self.remove_requested.emit(self)
                return
            if text == "-":
                self.clear()
                self.add_block_below.emit(self, "bullet")
                self.remove_requested.emit(self)
                return
            if text == "[]":
                self.clear()
                self.add_block_below.emit(self, "todo")
                self.remove_requested.emit(self)
                return

        super().keyPressEvent(e)

    def get_data(self):
        return {"type": self.block_type, "content": self.toPlainText(), "properties": {}}


class SlashMenu(QMenu):
    block_chosen = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QMenu { background:#313244; border:1px solid #45475A; border-radius:8px; padding:4px; }
            QMenu::item { padding:6px 16px; border-radius:4px; color:#CDD6F4; }
            QMenu::item:selected { background:#45475A; }
        """)
        for btype, (label, desc) in BLOCK_TYPES.items():
            if btype == "divider":
                self.addSeparator()
            act = QAction(f"{label}  —  {desc}", self)
            act.setData(btype)
            act.triggered.connect(lambda checked, t=btype: self.block_chosen.emit(t))
            self.addAction(act)


class BlockEditor(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("editorArea")
        self._page_id = None
        self._blocks = []
        self._save_timer = QTimer()
        self._save_timer.setSingleShot(True)
        self._save_timer.timeout.connect(self._save)
        self._build_ui()

    def _build_ui(self):
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        outer.addWidget(scroll)

        container = QWidget()
        scroll.setWidget(container)

        self._layout = QVBoxLayout(container)
        self._layout.setContentsMargins(80, 48, 80, 80)
        self._layout.setSpacing(2)
        self._layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        # Page title
        self._title_edit = QLineEdit()
        self._title_edit.setPlaceholderText("Başlıksız")
        self._title_edit.setStyleSheet(
            "font-size:32px; font-weight:bold; color:#CDD6F4; "
            "background:transparent; border:none; padding:0;"
        )
        self._title_edit.textChanged.connect(self._on_title_change)
        self._layout.addWidget(self._title_edit)

        # Add block hint
        hint = QLabel("'/' yazarak blok ekleyin")
        hint.setStyleSheet("color:#45475A; font-size:13px; padding:4px 0;")
        self._layout.addWidget(hint)
        self._hint = hint

        # Slash menu
        self._slash_menu = SlashMenu(self)
        self._slash_menu.block_chosen.connect(self._insert_block_type)
        self._pending_slash_widget = None

    def load_page(self, page_id):
        self._page_id = page_id
        self._clear_blocks()
        page = get_page(page_id)
        self._title_edit.blockSignals(True)
        self._title_edit.setText(page["title"])
        self._title_edit.blockSignals(False)
        blocks = get_blocks(page_id)
        if not blocks:
            self._add_block("text", "")
        else:
            for b in blocks:
                self._add_block(b["block_type"], b["content"], b.get("properties", {}))
        self._hint.setVisible(not blocks)

    def _clear_blocks(self):
        for w in list(self._blocks):
            self._layout.removeWidget(w)
            w.deleteLater()
        self._blocks.clear()

    def _add_block(self, block_type, content="", properties=None, after=None):
        props = properties or {}
        if block_type == "divider":
            widget = DividerBlock()
        elif block_type == "todo":
            widget = TodoBlock(content, props.get("checked", False))
            widget.content_changed.connect(self._schedule_save)
        else:
            widget = TextBlock(block_type, content)
            widget.add_block_below.connect(self._on_add_below)
            widget.remove_requested.connect(self._on_remove)
            widget.move_focus.connect(self._on_move_focus)
            widget.content_changed.connect(self._schedule_save)
            widget.textChanged.connect(lambda w=widget: self._check_slash(w))

        widget.remove_requested.connect(lambda w=widget: self._on_remove(w)) if block_type == "divider" else None

        if after is None:
            self._blocks.append(widget)
            self._layout.addWidget(widget)
        else:
            idx = self._blocks.index(after) + 1
            self._blocks.insert(idx, widget)
            self._layout.insertWidget(idx + 2, widget)  # +2 for title + hint

        if hasattr(widget, "setFocus"):
            widget.setFocus()
        self._schedule_save()
        return widget

    def _on_add_below(self, after_widget, block_type):
        self._add_block(block_type, "", after=after_widget)

    def _on_remove(self, widget):
        if len(self._blocks) <= 1:
            if isinstance(widget, TextBlock):
                widget.clear()
            return
        idx = self._blocks.index(widget)
        self._blocks.remove(widget)
        self._layout.removeWidget(widget)
        widget.deleteLater()
        # Focus previous
        target_idx = max(0, idx - 1)
        if self._blocks:
            target = self._blocks[target_idx]
            if hasattr(target, "setFocus"):
                target.setFocus()
        self._schedule_save()

    def _on_move_focus(self, widget, direction):
        idx = self._blocks.index(widget)
        target_idx = idx + direction
        if 0 <= target_idx < len(self._blocks):
            target = self._blocks[target_idx]
            if hasattr(target, "setFocus"):
                target.setFocus()

    def _check_slash(self, widget):
        text = widget.toPlainText()
        if text == "/":
            self._pending_slash_widget = widget
            pos = widget.mapToGlobal(widget.rect().bottomLeft())
            self._slash_menu.exec(pos)
            if widget.toPlainText() == "/":
                widget.clear()

    def _insert_block_type(self, block_type):
        after = self._pending_slash_widget
        if after and after in self._blocks:
            idx = self._blocks.index(after)
            self._blocks.remove(after)
            self._layout.removeWidget(after)
            after.deleteLater()
            dummy = None
            if idx > 0:
                dummy = self._blocks[idx - 1]
            self._add_block(block_type, "", after=dummy)
        else:
            self._add_block(block_type, "")
        self._pending_slash_widget = None

    def _on_title_change(self, text):
        if self._page_id:
            update_page(self._page_id, title=text or "Başlıksız")
        self._schedule_save()

    def _schedule_save(self):
        self._save_timer.start(800)

    def _save(self):
        if not self._page_id:
            return
        data = []
        for w in self._blocks:
            if hasattr(w, "get_data"):
                data.append(w.get_data())
        save_blocks(self._page_id, data)

    def add_new_block(self, block_type="text"):
        self._add_block(block_type, "")
