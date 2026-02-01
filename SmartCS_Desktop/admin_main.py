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

def main(page: ft.Page):
    # Load Config
    app_config = load_client_config()
    server_base = app_config.get("server_url", "ws://localhost:8000")
    my_dept = app_config.get("department", "General")

    page.title = f"Smart-CS Admin Center - {my_dept} Dept"
    page.bgcolor = "#101922" 
    page.padding = 0
    page.window_min_width = 1200 
    page.window_min_height = 700

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
        connect_url = f"{server_base}/ws/admin?dept={my_dept}"
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
