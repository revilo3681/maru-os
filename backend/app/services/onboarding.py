import bcrypt
from mnemonic import Mnemonic
from typing import Dict, Any, Tuple

class AccountService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashea la contraseña usando Bcrypt con 12 rondas."""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica la contraseña ingresada contra el hash encriptado."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    def generate_bip39_seed() -> Tuple[str, list]:
        """Genera una frase de recuperación de 12 palabras BIP39 en español."""
        mnemo = Mnemonic("spanish")
        words_str = mnemo.generate(strength=128) # 12 palabras
        words_list = words_str.split()
        return words_str, words_list

    @staticmethod
    def verify_bip39_seed(words_str: str) -> bool:
        """Valida que la frase de 12 palabras sea una semilla válida."""
        mnemo = Mnemonic("spanish")
        return mnemo.check(words_str)
