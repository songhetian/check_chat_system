import flet as ft
from ui.hq.dashboard import HQDashboard
from core.socket_client import SocketClient
from core.config_loader import load_client_config
import time

def main(page: ft.Page):
    # HQ ALWAYS USES SuperAdmin mode
    page.title = "Smart-CS HQ Command Center (Enterprise Full Vision)"
    page.bgcolor = "#0D1B2A"
    page.padding = 30
    page.window_full_screen = True # Launch in full screen for big displays

    # Initialize HQ View
    dashboard = HQDashboard()

    # Communication
    def on_message(msg):
        # Handle all departments messages
        # ... (Global logging logic)
        pass

    # Use SuperAdmin to see everything
    server_base = "ws://localhost:8000" # From config in prod
    client = SocketClient(f"{server_base}/ws/admin?dept=SuperAdmin", on_message=on_message)
    client.start()

    page.add(dashboard)

if __name__ == "__main__":
    ft.app(target=main)
