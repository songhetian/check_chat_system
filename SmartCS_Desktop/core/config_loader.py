import json
import os
import sys

# Default Config
DEFAULT_CONFIG = {
    "server_url": "ws://localhost:8000",
    "api_url": "http://localhost:8000/api"
}

def get_base_path():
    """Get absolute path to resource, works for dev and for PyInstaller"""
    if getattr(sys, 'frozen', False):
        # Running in a bundle (.exe)
        return os.path.dirname(sys.executable)
    # Running in normal Python environment
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_client_config():
    """
    Load config from 'server_config.json' in the same directory as the executable.
    """
    base_path = get_base_path()
    config_path = os.path.join(base_path, "server_config.json")
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_config = json.load(f)
                return {**DEFAULT_CONFIG, **user_config}
        except Exception as e:
            print(f"Error loading config: {e}. Using defaults.")
            return DEFAULT_CONFIG
    else:
        # Create a default file if missing
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
        except: pass
        return DEFAULT_CONFIG
