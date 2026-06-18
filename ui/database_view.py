from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QLabel, QInputDialog, QHeaderView, QAbstractItemView,
    QMenu, QMessageBox, QComboBox, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QAction
from database.db import (
    get_db_columns, add_db_column, delete_db_column,
    get_db_rows, add_db_row, update_db_row, delete_db_row,
    get_page, update_page
)

COL_TYPES = {
    "text":     "Metin",
    "number":   "Sayı",
    "checkbox": "Onay Kutusu",
    "date":     "Tarih",
    "select":   "Seçim",
}


class DatabaseView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._page_id = None
        self._columns = []
        self._rows = []
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 32, 40, 32)
        layout.setSpacing(12)

        # Title
        self._title = QLabel("Başlıksız")
        self._title.setObjectName("pageTitle")
        layout.addWidget(self._title)

        # Toolbar
        toolbar = QHBoxLayout()
        btn_add_col = QPushButton("+ Sütun Ekle")
        btn_add_col.clicked.connect(self._add_column)
        btn_add_row = QPushButton("+ Satır Ekle")
        btn_add_row.setObjectName("primaryBtn")
        btn_add_row.clicked.connect(self._add_row)
        toolbar.addWidget(btn_add_col)
        toolbar.addWidget(btn_add_row)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        # Table
        self._table = QTableWidget()
        self._table.setEditTriggers(QAbstractItemView.EditTrigger.DoubleClicked)
        self._table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectItems)
        self._table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self._table.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self._table.customContextMenuRequested.connect(self._context_menu)
        self._table.itemChanged.connect(self._on_cell_changed)
        layout.addWidget(self._table)

    def load_page(self, page_id):
        self._page_id = page_id
        page = get_page(page_id)
        self._title.setText(page["title"])
        self._refresh()

    def _refresh(self):
        self._table.blockSignals(True)
        self._columns = get_db_columns(self._page_id)
        self._rows = get_db_rows(self._page_id)

        self._table.clear()
        self._table.setColumnCount(len(self._columns))
        self._table.setRowCount(len(self._rows))

        headers = [c["name"] for c in self._columns]
        self._table.setHorizontalHeaderLabels(headers)

        for ri, row in enumerate(self._rows):
            for ci, col in enumerate(self._columns):
                val = row["row_data"].get(str(col["id"]), "")
                if col["col_type"] == "checkbox":
                    item = QTableWidgetItem()
                    item.setCheckState(
                        Qt.CheckState.Checked if val else Qt.CheckState.Unchecked
                    )
                    item.setData(Qt.ItemDataRole.UserRole, row["id"])
                    item.setData(Qt.ItemDataRole.UserRole + 1, str(col["id"]))
                else:
                    item = QTableWidgetItem(str(val))
                    item.setData(Qt.ItemDataRole.UserRole, row["id"])
                    item.setData(Qt.ItemDataRole.UserRole + 1, str(col["id"]))
                self._table.setItem(ri, ci, item)

        self._table.blockSignals(False)

    def _on_cell_changed(self, item):
        row_id = item.data(Qt.ItemDataRole.UserRole)
        col_id = item.data(Qt.ItemDataRole.UserRole + 1)
        if row_id is None or col_id is None:
            return
        col = next((c for c in self._columns if str(c["id"]) == col_id), None)
        if col and col["col_type"] == "checkbox":
            val = item.checkState() == Qt.CheckState.Checked
        else:
            val = item.text()
        # Update row_data
        for row in self._rows:
            if row["id"] == row_id:
                row["row_data"][col_id] = val
                update_db_row(row_id, row["row_data"])
                break

    def _add_column(self):
        name, ok = QInputDialog.getText(self, "Yeni Sütun", "Sütun adı:")
        if not ok or not name.strip():
            return
        col_types_list = list(COL_TYPES.items())
        type_labels = [v for _, v in col_types_list]
        chosen, ok2 = QInputDialog.getItem(
            self, "Sütun Tipi", "Veri tipi seçin:", type_labels, 0, False
        )
        if not ok2:
            return
        col_type = col_types_list[type_labels.index(chosen)][0]
        add_db_column(self._page_id, name.strip(), col_type)
        self._refresh()

    def _add_row(self):
        add_db_row(self._page_id)
        self._refresh()

    def _context_menu(self, pos):
        menu = QMenu(self)
        col_idx = self._table.columnAt(pos.x())
        row_idx = self._table.rowAt(pos.y())

        if col_idx >= 0 and col_idx < len(self._columns):
            col = self._columns[col_idx]
            act_del_col = QAction(f"🗑️  '{col['name']}' Sütununu Sil", self)
            act_del_col.triggered.connect(lambda: self._delete_column(col["id"]))
            menu.addAction(act_del_col)

        if row_idx >= 0 and row_idx < len(self._rows):
            row = self._rows[row_idx]
            act_del_row = QAction(f"🗑️  {row_idx+1}. Satırı Sil", self)
            act_del_row.triggered.connect(lambda: self._delete_row(row["id"]))
            menu.addAction(act_del_row)

        menu.addSeparator()
        act_add_row = QAction("+ Satır Ekle", self)
        act_add_row.triggered.connect(self._add_row)
        menu.addAction(act_add_row)

        menu.exec(self._table.viewport().mapToGlobal(pos))

    def _delete_column(self, col_id):
        reply = QMessageBox.question(
            self, "Sütunu Sil",
            "Bu sütunu silmek istiyor musunuz? İlgili veriler de silinecek.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            delete_db_column(col_id)
            for row in self._rows:
                row["row_data"].pop(str(col_id), None)
                update_db_row(row["id"], row["row_data"])
            self._refresh()

    def _delete_row(self, row_id):
        delete_db_row(row_id)
        self._refresh()
