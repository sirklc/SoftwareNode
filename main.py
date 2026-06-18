import sys
import os
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QFont
from database.db import init_db
from ui.main_window import MainWindow

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_stylesheet(app):
    qss_path = os.path.join(BASE_DIR, "resources", "styles.qss")
    if os.path.exists(qss_path):
        with open(qss_path, "r", encoding="utf-8") as f:
            app.setStyleSheet(f.read())


def main():
    init_db()

    app = QApplication(sys.argv)
    app.setApplicationName("SoftwareNode")
    app.setOrganizationName("SoftwareNode")

    font = QFont("Ubuntu", 11)
    app.setFont(font)

    load_stylesheet(app)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
