import flet as ft
import requests
import json
import threading
import time

class HQDashboard(ft.Control):
    def __init__(self):
        super().__init__()
        self.api_url = "http://localhost:8000/api"
        # Data Refs
        self.online_text = ft.Text("0", size=32, weight=ft.FontWeight.BOLD, color=ft.colors.CYAN_400)
        self.alert_text = ft.Text("0", size=32, weight=ft.FontWeight.BOLD, color=ft.colors.RED_400)
        self.time_text = ft.Text("", size=12, color=ft.colors.GREY_500)
        self.broadcast_input = ft.TextField(
            label="全员战术广播指令", 
            hint_text="输入消息，下发至全公司所有在线坐席...", 
            expand=True,
            border_color=ft.colors.CYAN_900
        )
        self.log_list = ft.ListView(expand=True, spacing=5)

    def did_mount(self):
        self.running = True
        threading.Thread(target=self._update_loop, daemon=True).start()

    def will_unmount(self):
        self.running = False

    def _update_loop(self):
        while self.running:
            try:
                res = requests.get(f"{self.api_url}/hq/overview")
                if res.status_code == 200:
                    data = res.json()
                    self.online_text.value = str(data["online_agents"])
                    self.alert_text.value = str(data["total_violations"])
                    self.time_text.value = f"最后同步时间: {data['last_update']}"
                    self.update()
            except: pass
            time.sleep(5)

    def send_global_broadcast(self, e):
        if not self.broadcast_input.value: return
        # Access the commander through page session
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            send_cmd("ALL", {
                "type": "WHISPER", 
                "content": f"【总部指令】: {self.broadcast_input.value}"
            })
            self.broadcast_input.value = ""
            self.page.snack_bar = ft.SnackBar(ft.Text("🚀 战术广播已全局下发！"), bgcolor=ft.colors.CYAN_900)
            self.page.snack_bar.open = True
            self.update()

    def build(self):
        # 1. KPI Cards
        kpi_row = ft.Row([
            self._build_kpi("实时在线坐席", self.online_text, ft.icons.PEOPLE_ALT, ft.colors.BLUE),
            self._build_kpi("今日违规拦截", self.alert_text, ft.icons.GAVEL_ROUNDED, ft.colors.RED),
            self._build_kpi("系统运行状态", ft.Text("良好", size=32, weight=ft.FontWeight.BOLD, color=ft.colors.GREEN_400), ft.icons.VINDICATOR, ft.colors.GREEN),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

        # 2. Control Console
        control_panel = ft.Container(
            content=ft.Column([
                ft.Text("战术控制台", size=16, weight=ft.FontWeight.BOLD, color=ft.colors.CYAN_200),
                ft.Row([
                    self.broadcast_input,
                    ft.ElevatedButton(
                        "发送全局广播", 
                        icon=ft.icons.SEND_ROUNDED, 
                        on_click=self.send_global_broadcast,
                        height=50,
                        style=ft.ButtonStyle(bgcolor=ft.colors.CYAN_900, color=ft.colors.WHITE)
                    )
                ])
            ]),
            bgcolor="#141e2a", padding=20, border_radius=15, border=ft.border.all(1, ft.colors.WHITE10)
        )

        return ft.Column([
            ft.Row([
                ft.Column([
                    ft.Text("🏢 Smart-CS 总部数字指挥舱", size=32, weight=ft.FontWeight.BOLD),
                    ft.Text("企业级全链路实时监管系统", size=14, color=ft.colors.GREY_500),
                ]),
                ft.Container(expand=True),
                self.time_text
            ]),
            ft.Divider(height=20, color=ft.colors.TRANSPARENT),
            kpi_row,
            ft.Row([
                ft.Container(
                    content=ft.Column([
                        ft.Text("实时安全动态 (全量流水)", size=16, weight=ft.FontWeight.BOLD),
                        self.log_list
                    ]),
                    bgcolor="#141e2a", padding=20, border_radius=15, expand=2, height=400
                ),
                ft.Column([
                    control_panel,
                    ft.Container(
                        content=ft.Column([
                            ft.Text("今日风险分布", size=16, weight=ft.FontWeight.BOLD),
                            ft.PieChart(
                                sections=[
                                    ft.PieChartSection(30, color=ft.colors.RED, radius=20),
                                    ft.PieChartSection(50, color=ft.colors.BLUE, radius=20),
                                    ft.PieChartSection(20, color=ft.colors.AMBER, radius=20),
                                ],
                                sections_space=2,
                                center_space_radius=40,
                            )
                        ]),
                        bgcolor="#141e2a", padding=20, border_radius=15, expand=True
                    )
                ], expand=1, spacing=20)
            ], expand=True, spacing=20)
        ], expand=True, spacing=10)

    def _build_kpi(self, title, control, icon, color):
        return ft.Container(
            content=ft.Row([
                ft.Icon(icon, color=color, size=40),
                ft.Column([
                    control,
                    ft.Text(title, size=14, color=ft.colors.GREY_500)
                ], spacing=0)
            ], alignment=ft.MainAxisAlignment.CENTER, spacing=20),
            bgcolor="#141e2a", padding=25, border_radius=15, width=350, border=ft.border.all(1, ft.colors.WHITE10)
        )
