from ui.admin.dashboard import DataCockpit
from ui.admin.settings import SettingsManager
from ui.admin.traceability import TraceabilityView
from ui.admin.stats import StatsView
from ui.admin.scheduler import MissionScheduler
from ui.admin.priority_queue import ViolationQueue
from ui.admin.honor_roll import HonorRollView
from core.socket_client import SocketClient
from core.config_loader import load_client_config
import flet as ft
import json
import time
import requests

import os

def main(page: ft.Page):
    # Load Basic Config
    app_config = load_client_config()
    api_base = app_config.get("api_url", "http://localhost:8000/api")
    server_base = app_config.get("server_url", "ws://localhost:8000")
    
    from core.config_loader import get_base_path
    session_file = os.path.join(get_base_path(), "assets", ".session_admin")

    page.title = "Smart-CS 管理端身份验证"
    page.window_width = 450
    page.window_height = 600
    page.window_center()
    page.bgcolor = "#0D1B2A"
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER

    user_input = ft.TextField(label="管理员工号", prefix_icon=ft.icons.ADMIN_PANEL_SETTINGS, width=320, border_color="#1e293b")
    pass_input = ft.TextField(label="安全访问密钥", prefix_icon=ft.icons.PASSWORD, password=True, can_reveal_password=True, width=320, border_color="#1e293b")
    remember_me = ft.Checkbox(label="记录管理员会话", value=True, label_style=ft.TextStyle(size=12))
    error_text = ft.Text("", color=ft.colors.RED_400)
    loading_ring = ft.ProgressRing(width=20, height=20, visible=False)
    
    login_btn = ft.ElevatedButton(
        content=ft.Row([ft.Text("验证身份并进入系统"), loading_ring], alignment=ft.MainAxisAlignment.CENTER, spacing=10),
        on_click=lambda e: perform_login(), 
        width=320, height=50,
        style=ft.ButtonStyle(bgcolor=ft.colors.BLUE_800, color=ft.colors.WHITE)
    )

    def perform_login():
        loading_ring.visible = True
        login_btn.disabled = True
        error_text.value = ""
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

                if user_profile["role"] not in ["SUPERVISOR", "ADMIN"]:
                    error_text.value = "访问被拒绝: 权限不足"
                    loading_ring.visible = False
                    login_btn.disabled = False
                    page.update()
                    return
                
                if remember_me.value:
                    os.makedirs(os.path.dirname(session_file), exist_ok=True)
                    with open(session_file, "w", encoding="utf-8") as f:
                        json.dump({"username": user_input.value, "password": pass_input.value, "role": "ADMIN"}, f)

                page.clean()
                start_admin_interface(page, user_profile, server_base, api_base, token)
            else:
                error_text.value = "验证失败: 账号或密钥错误"
                loading_ring.visible = False
                login_btn.disabled = False
                page.update()
        except Exception as err:
            error_text.value = f"网关超时: 无法连接服务器"
            loading_ring.visible = False
            login_btn.disabled = False
            page.update()

    page.add(
        ft.Container(
            content=ft.Column([
                ft.Icon(ft.icons.SECURITY, size=60, color=ft.colors.BLUE_400),
                ft.Text("管理控制中心", size=28, weight=ft.FontWeight.BOLD, letter_spacing=2),
                ft.Text("安全管理与监控门户", size=12, color=ft.colors.BLUE_GREY_400),
                ft.Divider(height=30, color=ft.colors.TRANSPARENT),
                user_input,
                pass_input,
                ft.Row([remember_me], alignment=ft.MainAxisAlignment.START, width=320),
                error_text,
                login_btn,
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
            padding=40, bgcolor="#14213D", border_radius=20, border=ft.border.all(1, ft.colors.WHITE10)
        )
    )

def start_admin_interface(page: ft.Page, user_profile: dict, server_base: str, api_base: str, token: str):
    my_name = user_profile["real_name"]
    my_dept = user_profile["department"]
    my_role = user_profile["role"]

    page.title = f"Smart-CS Admin Center - {my_name} ({my_role})"
    page.bgcolor = "#101922" 
    page.padding = 0
    page.window_min_width = 1200 
    page.window_min_height = 700
    page.window_maximized = True

    # Initialize Views
    dashboard_view = DataCockpit()
    stats_view = StatsView()
    mission_view = MissionScheduler(page)
    settings_view = SettingsManager()
    honor_view = HonorRollView(my_dept)
    
    priority_queue = ViolationQueue()

    # 1. Sidebar Navigation
    sidebar = ft.Container(
        content=ft.Column([
            ft.Container(content=ft.Icon(ft.icons.ADMIN_PANEL_SETTINGS, color=ft.colors.BLUE_400, size=30), padding=20),
            ft.NavigationRail(
                selected_index=0,
                label_type=ft.NavigationRailLabelType.ALL,
                min_width=100,
                destinations=[
                    ft.NavigationRailDestination(icon=ft.icons.DASHBOARD_OUTLINED, selected_icon=ft.icons.DASHBOARD, label="Cockpit"),
                    ft.NavigationRailDestination(icon=ft.icons.ANALYTICS_OUTLINED, selected_icon=ft.icons.ANALYTICS, label="Analysis"),
                    ft.NavigationRailDestination(icon=ft.icons.EMOJI_EVENTS_OUTLINED, selected_icon=ft.icons.EMOJI_EVENTS, label="Awards"),
                    ft.NavigationRailDestination(icon=ft.icons.ALARM_ON_OUTLINED, selected_icon=ft.icons.ALARM_ON, label="Missions"),
                    ft.NavigationRailDestination(icon=ft.icons.SECURITY_OUTLINED, selected_icon=ft.icons.SECURITY, label="Risk"),
                    ft.NavigationRailDestination(icon=ft.icons.SETTINGS_OUTLINED, selected_icon=ft.icons.SETTINGS, label="System"),
                ],
                on_change=lambda e: switch_page(e.control.selected_index),
                bgcolor=ft.colors.TRANSPARENT,
            ),
            ft.Container(expand=True), # Spacer
            ft.IconButton(
                icon=ft.icons.DARK_MODE_OUTLINED,
                tooltip="Switch Theme",
                on_click=lambda e: toggle_theme()
            ),
            ft.Container(height=20)
        ]),
        width=100, bgcolor="#0D1B2A", border=ft.border.only(right=ft.BorderSide(1, ft.colors.WHITE10))
    )

    def toggle_theme():
        page.theme_mode = ft.ThemeMode.LIGHT if page.theme_mode == ft.ThemeMode.DARK else ft.ThemeMode.DARK
        # Update Icon
        sidebar.content.controls[-2].icon = ft.icons.LIGHT_MODE if page.theme_mode == ft.ThemeMode.DARK else ft.icons.DARK_MODE_OUTLINED
        # Note: Custom Hex colors in sub-views like "#101922" might need adjustment 
        # but Flet's automatic theme inheritance will handle standard components.
        page.update()

    page.theme_mode = ft.ThemeMode.DARK # Default

    # 2. Content Area
    content_area = ft.Container(expand=True, padding=20, content=dashboard_view)
    queue_sidebar = ft.Container(width=350, padding=10, bgcolor="#0D1B2A", content=priority_queue, border=ft.border.only(left=ft.BorderSide(1, ft.colors.WHITE10)))

    # 3. Switching Logic
    def switch_page(index):
        if index == 0: content_area.content = dashboard_view; queue_sidebar.visible = True
        elif index == 1: content_area.content = stats_view; queue_sidebar.visible = True
        elif index == 2: content_area.content = honor_view; queue_sidebar.visible = True
        elif index == 3: content_area.content = mission_view; queue_sidebar.visible = True
        elif index == 4: content_area.content = settings_view; queue_sidebar.visible = False
        elif index == 5: 
            sm = SettingsManager(); sm.tabs.selected_index = 3
            content_area.content = sm; queue_sidebar.visible = False
        page.update()

    # 4. Layout
    page.add(ft.Row(controls=[sidebar, ft.VerticalDivider(width=1, color=ft.colors.WHITE10), content_area, queue_sidebar], expand=True, spacing=0))

    # WebSocket Message Handler
    def on_server_message(msg):
        msg_type = msg.get("type")
        if msg_type == "AGENT_VIOLATION":
            priority_queue.add_or_update_alert(msg.get("from"), msg.get("keyword"), msg.get("timestamp", time.time()))
        if msg_type == "HELP_REQUEST":
            page.snack_bar = ft.SnackBar(content=ft.Text(f"❓ HELP: Agent {msg.get('agent_id')}"), bgcolor=ft.colors.AMBER_700)
            page.snack_bar.open = True
        page.update()

    # Connect
    try:
        # If ADMIN, use SuperAdmin to see everything
        connect_url = f"{server_base}/ws/admin?token={token}"
        client = SocketClient(connect_url, on_message=on_server_message)
        client.start()
    except: pass

    # --- COMMANDER ACTIONS ---
    def send_command(agent_id, payload):
        # Generic wrapper for socket send
        client.send({
            "target_agent": agent_id,
            **payload
        })

    # Export to components via Session
    page.session.set("send_command", send_command)

    # Example: In Cockpit view, we could add a 'Global Reload' button
    # Let's mock it in on_server_message or just keep it available for components

if __name__ == "__main__":
    ft.app(target=main)
