from os import environ
from pathlib import Path

import dj_database_url
from django.core.management.utils import get_random_secret_key
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

######################################################################
# General
######################################################################
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = environ.get("SECRET_KEY", get_random_secret_key())

DEBUG = environ.get("DEBUG", "") == "1"

ALLOWED_HOSTS = [
    host.strip()
    for host in environ.get("ALLOWED_HOSTS", "localhost,api,10.0.2.2").split(",")
    if host.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# Railway (and most PaaS providers) terminate TLS at a reverse proxy and
# forward plain HTTP internally, so Django needs to trust the
# X-Forwarded-Proto header to know a request was actually HTTPS - otherwise
# CSRF checks and redirects misbehave in production.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

WSGI_APPLICATION = "api.wsgi.application"

ROOT_URLCONF = "api.urls"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

######################################################################
# Apps
######################################################################
INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "api",
    "workouts",
]

######################################################################
# Middleware
######################################################################
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

######################################################################
# Templates
######################################################################
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

######################################################################
# Database
#
# Railway's Postgres plugin exposes a single DATABASE_URL - prefer that when
# present. Local dev (docker-compose) instead sets the individual
# DATABASE_HOST/USER/PASSWORD/NAME vars from .env.backend.
######################################################################
if environ.get("DATABASE_URL"):
    DATABASES = {
        "default": {
            **dj_database_url.parse(environ["DATABASE_URL"], conn_max_age=600),
            "TEST": {"NAME": "test"},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "USER": environ.get("DATABASE_USER", "postgres"),
            "PASSWORD": environ.get("DATABASE_PASSWORD", "change-password"),
            "NAME": environ.get("DATABASE_NAME", "db"),
            "HOST": environ.get("DATABASE_HOST", "db"),
            "PORT": "5432",
            "TEST": {
                "NAME": "test",
            },
        }
    }

######################################################################
# Password validation (only relevant to the Django admin login)
######################################################################
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

######################################################################
# Internationalization
######################################################################
LANGUAGE_CODE = "en-gb"

TIME_ZONE = "Europe/London"

USE_I18N = True

USE_L10N = True

USE_TZ = True

######################################################################
# Staticfiles
######################################################################
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

######################################################################
# Rest Framework
#
# This app is for personal, single-user use with no login flow, so the
# API is open (AllowAny) and relies on the deployment not being publicly
# discoverable / on CORS restricting which origin can call it.
######################################################################
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": None,
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

######################################################################
# CORS
######################################################################
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(
        ","
    )
    if origin.strip()
]

######################################################################
# Unfold
######################################################################
UNFOLD = {
    "SITE_HEADER": _("Workout Tracker Admin"),
    "SITE_TITLE": _("Workout Tracker Admin"),
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": _("Workouts"),
                "separator": False,
                "items": [
                    {
                        "title": _("Programs"),
                        "icon": "fitness_center",
                        "link": reverse_lazy("admin:workouts_program_changelist"),
                    },
                    {
                        "title": _("Exercises"),
                        "icon": "exercise",
                        "link": reverse_lazy("admin:workouts_exercise_changelist"),
                    },
                    {
                        "title": _("Sessions"),
                        "icon": "history",
                        "link": reverse_lazy("admin:workouts_workoutsession_changelist"),
                    },
                ],
            },
        ],
    },
}

######################################################################
# Spectacular
######################################################################
SPECTACULAR_SETTINGS = {
    "TITLE": "Workout Tracker API",
    "COMPONENT_SPLIT_REQUEST": True,
}

######################################################################
# Deployment
######################################################################
