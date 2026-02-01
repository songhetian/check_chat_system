import flet as ft
import requests
from ui.hq.dashboard import HQDashboard
from core.socket_client import SocketClient
from core.config_loader import load_client_config
import time

import os

def main(page: ft.Page):
    app_config = load_client_config()
    api_base = app_config.get("api_url", "http://localhost:8000/api")
    server_base = app_config.get("server_url", "ws://localhost:8000")
    
    from core.config_loader import get_base_path
    session_file = os.path.join(get_base_path(), "assets", ".session_hq")

    page.title = "Smart-CS 总部战略指挥链路"
    page.window_width = 400
    page.window_height = 550
    page.bgcolor = "#050A14"
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER

    user_input = ft.TextField(label="指挥官账号", width=300, border_color=ft.colors.CYAN_900)
    pass_input = ft.TextField(label="战略访问密钥", width=300, password=True, border_color=ft.colors.CYAN_900)
    remember_me = ft.Checkbox(label="保持指挥官会话", value=True)
    error_text = ft.Text("", color=ft.colors.RED_400)
    loading_ring = ft.ProgressRing(width=20, visible=False)

    def perform_login():
        loading_ring.visible = True
        page.update()
        try:
            res = requests.post(f"{api_base}/auth/login", json={
                "username": user_input.value,
                "password": pass_input.value
            }, timeout=5)
            if res.status_code == 200:
                data = res.json()
                user_profile = data["user"]
                token = data["token"]
                
                if user_profile["role"] not in ["HQ", "ADMIN"]:
                    error_text.value = "访问拒绝: 仅限指挥官进入"
                    loading_ring.visible = False
                    page.update()
                    return
                
                if remember_me.value:
                    os.makedirs(os.path.dirname(session_file), exist_ok=True)
                    with open(session_file, "w", encoding="utf-8") as f:
                        json.dump({"username": user_input.value, "password": pass_input.value, "role": "HQ"}, f)

                page.clean()
                start_hq_interface(page, user_profile, server_base, token)
            else:
                error_text.value = "身份验证失败"
                loading_ring.visible = False
                page.update()
        except Exception as err:
            error_text.value = f"上行链路故障: 无法连接"
            loading_ring.visible = False
            page.update()

    if os.path.exists(session_file):
        try:
            with open(session_file, "r") as f:
                saved = json.load(f)
                user_input.value = saved["username"]
                pass_input.value = saved["password"]
        except: pass

    page.add(
        ft.Column([
            ft.Icon(ft.icons.HUB, size=80, color=ft.colors.CYAN_400),
            ft.Text("总部指挥中心", size=24, weight=ft.FontWeight.BOLD, color=ft.colors.CYAN_100),
            ft.Divider(height=20, color=ft.colors.TRANSPARENT),
            user_input,
            pass_input,
            remember_me,
            error_text,
            ft.ElevatedButton(
                content=ft.Row([ft.Text("建立战略连接"), loading_ring], alignment=ft.MainAxisAlignment.CENTER),
                on_click=lambda e: perform_login(), 
                width=300, bgcolor=ft.colors.CYAN_900
            ),
        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER)
    )

def start_hq_interface(page: ft.Page, user_profile: dict, server_base: str, token: str):
    # HQ ALWAYS USES SuperAdmin mode
    page.title = f"Smart-CS HQ Command Center - {user_profile['real_name']}"
    page.bgcolor = "#0D1B2A"
    page.padding = 30
    page.window_full_screen = True 

    dashboard = HQDashboard()

    def on_message(msg): pass

    connect_url = f"{server_base}/ws/admin?token={token}"
    client = SocketClient(connect_url, on_message=on_message)
    client.start()

    page.add(dashboard)

if __name__ == "__main__":
    ft.app(target=main)
