import os

files_to_write = {
    '.env.example': '''DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=newscard
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
''',
    'docker-compose.yml': '''version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: newscard
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  web:
    build: .
    command: python backend/manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
volumes:
  postgres_data:
''',
    'requirements.txt': '''Django==4.2
djangorestframework==3.15
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.6
djangorestframework-simplejwt==5.3.1
reportlab==4.0
openpyxl==3.1
''',
    'requirements-desktop.txt': '''PyQt6==6.6.1
requests==2.31.0
matplotlib==3.8.2
reportlab==4.0
openpyxl==3.1
plyer==2.1.0
''',
    'backend/newscard_project/settings/base.py': '''import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY', 'default-key')
DEBUG = True
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'apps.core',
    'apps.accounts',
    'apps.customers',
    'apps.rounds',
    'apps.publications',
    'apps.billing',
    'apps.delivery',
    'apps.suppliers',
    'apps.analytics',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'newscard_project.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True}]
WSGI_APPLICATION = 'newscard_project.wsgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
''',
    'backend/newscard_project/urls.py': '''from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/billing/', include('apps.billing.urls')),
]
''',
    'backend/apps/publications/models.py': '''from django.db import models
from apps.core.models import BaseModel
from decimal import Decimal

class Publication(BaseModel):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    type = models.CharField(max_length=50, default='newspaper')
''',
    'desktop/main.py': '''import sys
from PyQt6.QtWidgets import QApplication
from ui.login import LoginWindow

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = LoginWindow()
    window.show()
    sys.exit(app.exec())
''',
    'desktop/ui/login.py': '''from PyQt6.QtWidgets import QDialog, QVBoxLayout, QLabel, QLineEdit, QPushButton, QMessageBox

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
''',
    'tests/fixtures/seed_data.json': '''[
  {
    "model": "auth.user",
    "pk": 1,
    "fields": {
      "username": "admin",
      "is_superuser": true,
      "is_staff": true,
      "is_active": true
    }
  }
]
'''
}

for path, content in files_to_write.items():
    full_path = os.path.join('/media/harshpandya/2FA1-E45F/newscard', path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)

