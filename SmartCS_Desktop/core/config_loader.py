import json
import os

# Default Config
DEFAULT_CONFIG = {
    "server_url": "ws://localhost:8000",
    "api_url": "http://localhost:8000/api",
    "department": "General", # Default department if not specified
    "agent_name": "Unknown Agent"
}

def load_client_config():
    """
    Load config from 'server_config.json' in the same directory as the executable.
    If not found, returns default localhost config.
    """
    config_path = "server_config.json"
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_config = json.load(f)
                # Merge with defaults
                return {**DEFAULT_CONFIG, **user_config}
        except Exception as e:
            print(f"Error loading config: {e}. Using defaults.")
            return DEFAULT_CONFIG
    else:
        # Create a default file for user convenience
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
        except:
            pass
        return DEFAULT_CONFIG
