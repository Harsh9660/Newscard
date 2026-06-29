from cryptography.fernet import Fernet

from backend.config import FERNET_KEY_FILE


def _load_or_create_key() -> bytes:
    if FERNET_KEY_FILE.exists():
        return FERNET_KEY_FILE.read_bytes().strip()
    key = Fernet.generate_key()
    FERNET_KEY_FILE.write_bytes(key)
    return key


_fernet = Fernet(_load_or_create_key())


def encrypt_value(value: str | None) -> str | None:
    if value is None or value == "":
        return value
    return _fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str | None) -> str | None:
    if value is None or value == "":
        return value
    try:
        return _fernet.decrypt(value.encode("utf-8")).decode("utf-8")
    except Exception:
        return value
