from PyQt6.QtWidgets import QDialog, QVBoxLayout, QLabel, QLineEdit, QPushButton, QMessageBox

class LoginWindow(QDialog):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Login - Newscard")
        layout = QVBoxLayout(self)
        self.user = QLineEdit()
        self.user.setPlaceholderText("Username")
        self.pwd = QLineEdit()
        self.pwd.setPlaceholderText("Password")
        self.pwd.setEchoMode(QLineEdit.EchoMode.Password)
        btn = QPushButton("Login")
        btn.clicked.connect(self.login)
        layout.addWidget(self.user)
        layout.addWidget(self.pwd)
        layout.addWidget(btn)
        
    def login(self):
        self.accept()
