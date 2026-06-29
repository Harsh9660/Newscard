import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'newscard_project.settings.development')

app = Celery('newscard_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
