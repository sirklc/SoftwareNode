from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTreeWidget, QTreeWidgetItem,
    QPushButton, QLabel, QMenu, QInputDialog, QMessageBox
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QIcon, QAction
from database.db import (
    get_pages, create_page, delete_page, update_page, get_page
)

PAGE_ICONS = {
    "note": "📄",
    "database": "🗃️",
    "calendar": "📅",
}

VIEW_ICONS = {
    "note": "📝 Notlar",
    "database": "🗃️ Veritabanı",
    "calendar": "📅 Takvim",
}


class Sidebar(QWidget):
    page_selected = pyqtSignal(int, str)  # (page_id, page_type)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("sidebar")
        self.setMinimumWidth(220)
        self.setMaximumWidth(320)
        self._build_ui()
        self.refresh()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 12, 8, 8)
        layout.setSpacing(4)

        # App name
        title = QLabel("⬡ SoftwareNode")
        title.setStyleSheet("font-size:15px; font-weight:bold; color:#89B4FA; padding:4px 8px;")
        layout.addWidget(title)

        # Section label
        lbl = QLabel("SAYFALAR")
        lbl.setObjectName("sectionTitle")
        layout.addWidget(lbl)

        # Tree
        self.tree = QTreeWidget()
        self.tree.setHeaderHidden(True)
        self.tree.setIndentation(16)
        self.tree.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.tree.customContextMenuRequested.connect(self._context_menu)
        self.tree.itemClicked.connect(self._on_item_click)
        layout.addWidget(self.tree)

        # Bottom buttons
        btn_row = QHBoxLayout()
        btn_add = QPushButton("+ Yeni Sayfa")
        btn_add.setObjectName("primaryBtn")
        btn_add.clicked.connect(lambda: self._new_page(None))
        btn_row.addWidget(btn_add)
        layout.addLayout(btn_row)

    def refresh(self, select_id=None):
        self.tree.clear()
        self._populate(None, self.tree.invisibleRootItem())
        self.tree.expandAll()
        if select_id:
            self._select_item(select_id)

    def _populate(self, parent_id, parent_item):
        pages = get_pages(parent_id)
        for p in pages:
            icon = PAGE_ICONS.get(p["page_type"], "📄")
            item = QTreeWidgetItem([f"{icon}  {p['title']}"])
            item.setData(0, Qt.ItemDataRole.UserRole, p["id"])
            item.setData(0, Qt.ItemDataRole.UserRole + 1, p["page_type"])
            parent_item.addChild(item)
            self._populate(p["id"], item)

    def _on_item_click(self, item, _col):
        page_id = item.data(0, Qt.ItemDataRole.UserRole)
        page_type = item.data(0, Qt.ItemDataRole.UserRole + 1)
        if page_id:
            self.page_selected.emit(page_id, page_type)

    def _select_item(self, page_id):
        def _search(parent):
            for i in range(parent.childCount()):
                child = parent.child(i)
                if child.data(0, Qt.ItemDataRole.UserRole) == page_id:
                    self.tree.setCurrentItem(child)
                    return True
                if _search(child):
                    return True
            return False
        _search(self.tree.invisibleRootItem())

    def _context_menu(self, pos):
        item = self.tree.itemAt(pos)
        menu = QMenu(self)

        act_new = QAction("📄  Yeni Alt Sayfa", self)
        act_db = QAction("🗃️  Yeni Veritabanı", self)
        act_cal = QAction("📅  Yeni Takvim", self)
        act_rename = QAction("✏️  Yeniden Adlandır", self)
        act_delete = QAction("🗑️  Sil", self)

        parent_id = item.data(0, Qt.ItemDataRole.UserRole) if item else None

        act_new.triggered.connect(lambda: self._new_page(parent_id, "note"))
        act_db.triggered.connect(lambda: self._new_page(parent_id, "database"))
        act_cal.triggered.connect(lambda: self._new_page(parent_id, "calendar"))
        menu.addAction(act_new)
        menu.addAction(act_db)
        menu.addAction(act_cal)

        if item:
            # Capture page_id before menu.exec() — item may be deleted by Qt after that
            captured_id = item.data(0, Qt.ItemDataRole.UserRole)
            menu.addSeparator()
            act_rename.triggered.connect(lambda: self._rename_page(captured_id))
            act_delete.triggered.connect(lambda: self._delete_page(captured_id))
            menu.addAction(act_rename)
            menu.addAction(act_delete)

        menu.exec(self.tree.viewport().mapToGlobal(pos))

    def _new_page(self, parent_id, page_type="note"):
        icons = {"note": "📄", "database": "🗃️", "calendar": "📅"}
        type_names = {"note": "Not", "database": "Veritabanı", "calendar": "Takvim"}
        name, ok = QInputDialog.getText(
            self, "Yeni Sayfa", f"Yeni {type_names.get(page_type,'Sayfa')} adı:"
        )
        if ok and name.strip():
            pid = create_page(name.strip(), parent_id, icons.get(page_type, "📄"), page_type)
            self.refresh(select_id=pid)
            self.page_selected.emit(pid, page_type)

    def _rename_page(self, page_id):
        old = get_page(page_id)["title"]
        name, ok = QInputDialog.getText(self, "Yeniden Adlandır", "Yeni ad:", text=old)
        if ok and name.strip():
            update_page(page_id, title=name.strip())
            self.refresh(select_id=page_id)

    def _delete_page(self, page_id):
        page = get_page(page_id)
        reply = QMessageBox.question(
            self, "Sil",
            f"'{page['title']}' sayfasını ve tüm alt sayfalarını silmek istiyor musunuz?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            delete_page(page_id)
            self.refresh()
