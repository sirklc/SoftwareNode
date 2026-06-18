from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel,
    QPushButton, QDialog, QLineEdit, QTextEdit, QDialogButtonBox,
    QScrollArea, QFrame, QMessageBox, QColorDialog
)
from PyQt6.QtCore import Qt, QDate, pyqtSignal
from PyQt6.QtGui import QColor, QPainter, QBrush, QPen, QFont
from database.db import get_events, add_event, delete_event, update_event, get_page

MONTHS_TR = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
]
DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]


class EventDialog(QDialog):
    def __init__(self, date_str, event=None, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Etkinlik")
        self.setMinimumWidth(360)
        self._result = None

        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        lbl = QLabel(f"Tarih: {date_str}")
        lbl.setStyleSheet("color:#89B4FA; font-weight:bold;")
        layout.addWidget(lbl)

        self._title_edit = QLineEdit()
        self._title_edit.setPlaceholderText("Etkinlik adı...")
        if event:
            self._title_edit.setText(event["title"])
        layout.addWidget(self._title_edit)

        self._note_edit = QTextEdit()
        self._note_edit.setPlaceholderText("Not (isteğe bağlı)...")
        self._note_edit.setMaximumHeight(100)
        if event:
            self._note_edit.setPlainText(event.get("note", ""))
        layout.addWidget(self._note_edit)

        # Color picker
        color_row = QHBoxLayout()
        color_row.addWidget(QLabel("Renk:"))
        self._color = event["color"] if event else "#89B4FA"
        self._color_btn = QPushButton("  ")
        self._color_btn.setFixedWidth(40)
        self._color_btn.setStyleSheet(f"background:{self._color}; border-radius:4px;")
        self._color_btn.clicked.connect(self._pick_color)
        color_row.addWidget(self._color_btn)
        color_row.addStretch()
        layout.addLayout(color_row)

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _pick_color(self):
        c = QColorDialog.getColor(QColor(self._color), self)
        if c.isValid():
            self._color = c.name()
            self._color_btn.setStyleSheet(f"background:{self._color}; border-radius:4px;")

    def get_data(self):
        return {
            "title": self._title_edit.text().strip(),
            "note":  self._note_edit.toPlainText().strip(),
            "color": self._color,
        }


class DayCell(QFrame):
    clicked = pyqtSignal(str)  # date string YYYY-MM-DD

    def __init__(self, date_str, day_num, is_today=False, is_other_month=False, events=None):
        super().__init__()
        self._date_str = date_str
        self._events = events or []
        self.setMinimumHeight(90)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        base_bg = "#181825" if not is_other_month else "#1A1A2A"
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {base_bg};
                border: 1px solid #313244;
                border-radius: 4px;
            }}
            QFrame:hover {{
                border-color: #89B4FA;
            }}
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 4, 6, 4)
        layout.setSpacing(2)

        # Day number
        day_lbl = QLabel(str(day_num))
        if is_today:
            day_lbl.setStyleSheet(
                "background:#89B4FA; color:#1E1E2E; border-radius:10px; "
                "padding:1px 5px; font-weight:bold;"
            )
            day_lbl.setFixedWidth(26)
            day_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        else:
            color = "#45475A" if is_other_month else "#CDD6F4"
            day_lbl.setStyleSheet(f"color:{color}; font-size:13px; font-weight:bold;")
        layout.addWidget(day_lbl)

        # Events
        for ev in self._events[:3]:
            chip = QLabel(f"● {ev['title']}")
            chip.setStyleSheet(
                f"background:{ev['color']}22; color:{ev['color']}; "
                "border-radius:3px; padding:1px 4px; font-size:11px;"
            )
            chip.setWordWrap(False)
            layout.addWidget(chip)

        if len(self._events) > 3:
            more = QLabel(f"+{len(self._events)-3} daha")
            more.setStyleSheet("color:#6C7086; font-size:10px;")
            layout.addWidget(more)

        layout.addStretch()

    def mousePressEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit(self._date_str)
        super().mousePressEvent(e)


class CalendarView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._page_id = None
        self._year = QDate.currentDate().year()
        self._month = QDate.currentDate().month()
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 24, 32, 24)
        layout.setSpacing(12)

        # Page title
        self._page_title = QLabel("Takvim")
        self._page_title.setObjectName("pageTitle")
        layout.addWidget(self._page_title)

        # Nav bar
        nav = QHBoxLayout()
        btn_prev = QPushButton("◀")
        btn_prev.setFixedWidth(36)
        btn_prev.clicked.connect(self._prev_month)
        btn_next = QPushButton("▶")
        btn_next.setFixedWidth(36)
        btn_next.clicked.connect(self._next_month)
        self._month_label = QLabel()
        self._month_label.setStyleSheet("font-size:18px; font-weight:bold; color:#89B4FA;")
        self._month_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        btn_today = QPushButton("Bugün")
        btn_today.clicked.connect(self._go_today)
        btn_add = QPushButton("+ Etkinlik Ekle")
        btn_add.setObjectName("primaryBtn")
        btn_add.clicked.connect(lambda: self._open_event_dialog(
            QDate.currentDate().toString("yyyy-MM-dd")
        ))

        nav.addWidget(btn_prev)
        nav.addWidget(self._month_label, 1)
        nav.addWidget(btn_next)
        nav.addSpacing(16)
        nav.addWidget(btn_today)
        nav.addWidget(btn_add)
        layout.addLayout(nav)

        # Grid
        self._grid_widget = QWidget()
        self._grid = QGridLayout(self._grid_widget)
        self._grid.setSpacing(3)
        layout.addWidget(self._grid_widget, 1)

        self._draw_calendar()

    def load_page(self, page_id):
        self._page_id = page_id
        page = get_page(page_id)
        self._page_title.setText(page["title"])
        self._draw_calendar()

    def _draw_calendar(self):
        # Clear grid
        while self._grid.count():
            item = self._grid.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        self._month_label.setText(f"{MONTHS_TR[self._month]} {self._year}")

        # Headers
        for col, day_name in enumerate(DAYS_TR):
            lbl = QLabel(day_name)
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setStyleSheet("color:#89B4FA; font-weight:bold; padding:4px;")
            self._grid.addWidget(lbl, 0, col)

        today = QDate.currentDate()
        first_day = QDate(self._year, self._month, 1)
        days_in_month = first_day.daysInMonth()
        start_col = (first_day.dayOfWeek() - 1) % 7  # Mon=0

        events = get_events(self._year, self._month)
        events_by_date: dict = {}
        for ev in events:
            events_by_date.setdefault(ev["event_date"], []).append(ev)

        # Previous month fill
        prev_month_date = first_day.addMonths(-1)
        prev_days = prev_month_date.daysInMonth()
        row, col = 1, 0

        for i in range(start_col):
            d = prev_days - start_col + i + 1
            ds = f"{prev_month_date.year()}-{prev_month_date.month():02d}-{d:02d}"
            cell = DayCell(ds, d, is_other_month=True)
            cell.clicked.connect(self._open_event_dialog)
            self._grid.addWidget(cell, row, col)
            col += 1

        # Current month
        for day in range(1, days_in_month + 1):
            date_str = f"{self._year}-{self._month:02d}-{day:02d}"
            is_today = (today.year() == self._year and today.month() == self._month
                        and today.day() == day)
            cell = DayCell(
                date_str, day,
                is_today=is_today,
                events=events_by_date.get(date_str, [])
            )
            cell.clicked.connect(self._open_event_dialog)
            self._grid.addWidget(cell, row, col)
            col += 1
            if col == 7:
                col = 0
                row += 1

        # Next month fill
        remaining = (7 - col) % 7
        for i in range(1, remaining + 1):
            next_month = first_day.addMonths(1)
            ds = f"{next_month.year()}-{next_month.month():02d}-{i:02d}"
            cell = DayCell(ds, i, is_other_month=True)
            cell.clicked.connect(self._open_event_dialog)
            self._grid.addWidget(cell, row, col)
            col += 1

    def _open_event_dialog(self, date_str):
        events = get_events(self._year, self._month)
        day_events = [e for e in events if e["event_date"] == date_str]

        if day_events:
            menu_widget = QDialog(self)
            menu_widget.setWindowTitle(f"{date_str} Etkinlikleri")
            menu_widget.setMinimumWidth(300)
            vl = QVBoxLayout(menu_widget)

            for ev in day_events:
                row = QHBoxLayout()
                chip = QLabel(f"● {ev['title']}")
                chip.setStyleSheet(f"color:{ev['color']};")
                del_btn = QPushButton("🗑")
                del_btn.setFixedWidth(28)
                del_btn.clicked.connect(lambda _, eid=ev["id"]: (
                    delete_event(eid), menu_widget.accept(), self._draw_calendar()
                ))
                row.addWidget(chip, 1)
                row.addWidget(del_btn)
                vl.addLayout(row)

            vl.addSpacing(8)
            add_btn = QPushButton("+ Yeni Etkinlik Ekle")
            add_btn.setObjectName("primaryBtn")

            def _add_and_close():
                menu_widget.accept()
                self._create_event(date_str)

            add_btn.clicked.connect(_add_and_close)
            vl.addWidget(add_btn)
            menu_widget.exec()
        else:
            self._create_event(date_str)

    def _create_event(self, date_str):
        dlg = EventDialog(date_str, parent=self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if data["title"]:
                add_event(data["title"], date_str, data["color"], data["note"])
                self._draw_calendar()

    def _prev_month(self):
        d = QDate(self._year, self._month, 1).addMonths(-1)
        self._year, self._month = d.year(), d.month()
        self._draw_calendar()

    def _next_month(self):
        d = QDate(self._year, self._month, 1).addMonths(1)
        self._year, self._month = d.year(), d.month()
        self._draw_calendar()

    def _go_today(self):
        today = QDate.currentDate()
        self._year, self._month = today.year(), today.month()
        self._draw_calendar()
