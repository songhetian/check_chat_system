import flet as ft
from datetime import datetime

class DataCockpit(ft.Control):
    def __init__(self):
        super().__init__()
        self.broadcast_input = ft.TextField(
            label="部门战术指令", 
            hint_text="输入指令，下发至本部门所有在线坐席...", 
            expand=True,
            border_color=ft.colors.BLUE_700,
            text_size=14
        )

    def _send_broadcast(self, e):
        if not self.broadcast_input.value: return
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            # target_agent="ALL" 在服务端会根据当前管理员的部门自动过滤
            send_cmd("ALL", {
                "type": "WHISPER",
                "content": f"【主管指令】: {self.broadcast_input.value}"
            })
            self.broadcast_input.value = ""
            self.page.snack_bar = ft.SnackBar(ft.Text("✅ 部门指令已发送"), bgcolor=ft.colors.BLUE_800)
            self.page.snack_bar.open = True
            self.update()

    def _quick_msg(self, text):
        self.broadcast_input.value = text
        self._send_broadcast(None)

    def build(self):
        # 0. Quick Command Row
        command_bar = ft.Container(
            content=ft.Row([
                ft.Icon(ft.icons.CAMPAIGN, color=ft.colors.BLUE_400),
                self.broadcast_input,
                ft.ElevatedButton("发送指令", icon=ft.icons.SEND, on_click=self._send_broadcast, bgcolor=ft.colors.BLUE_800, color=ft.colors.WHITE),
                ft.TextButton("快速提醒", on_click=lambda _: self._quick_msg("请注意服务礼仪，避免违规词汇")),
                ft.TextButton("加紧处理", on_click=lambda _: self._quick_msg("咨询量较大，请各位加快响应速度")),
            ], spacing=15),
            bgcolor="#141e2a", padding=15, border_radius=12, border=ft.border.all(1, ft.colors.WHITE10)
        )

        # 1. Top KPI Cards
        kpi_row = ft.Row(
            controls=[
                self._build_kpi_card("在线坐席", "24", ft.icons.PEOPLE, ft.colors.BLUE_400),
                self._build_kpi_card("今日违规", "128", ft.icons.WARNING_AMBER, ft.colors.RED_400),
                self._build_kpi_card("待处理求助", "3", ft.icons.NOTIFICATIONS_ACTIVE, ft.colors.ORANGE_400),
                self._build_kpi_card("系统健康度", "98%", ft.icons.MONITOR_HEART, ft.colors.GREEN_400),
            ],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN
        )

        # 2. Main Charts Area
        chart_section = ft.Container(
            content=ft.Row(
                controls=[
                    # Violation Trend Chart
                    ft.Container(
                        content=ft.Column([
                            ft.Text("违规趋势图 (24h)", size=16, weight=ft.FontWeight.BOLD),
                            self._build_line_chart()
                        ]),
                        expand=2,
                        bgcolor="#1c232e",
                        padding=20,
                        border_radius=10,
                        border=ft.border.all(1, ft.colors.WHITE10)
                    ),
                    # Risk Distribution Pie
                    ft.Container(
                        content=ft.Column([
                            ft.Text("风险类别分布", size=16, weight=ft.FontWeight.BOLD),
                            ft.Divider(color=ft.colors.TRANSPARENT, height=20),
                            self._build_risk_ring("话术不当", 0.65, ft.colors.RED_500),
                            self._build_risk_ring("态度恶劣", 0.25, ft.colors.ORANGE_500),
                            self._build_risk_ring("隐私泄露", 0.10, ft.colors.BLUE_500),
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        expand=1,
                        bgcolor="#1c232e",
                        padding=20,
                        border_radius=10,
                        border=ft.border.all(1, ft.colors.WHITE10)
                    )
                ],
                spacing=20
            ),
            height=300
        )

        # 3. Real-time Live Log
        log_section = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.icons.HISTORY, color=ft.colors.BLUE_200),
                    ft.Text("实时审计日志流水", size=16, weight=ft.FontWeight.BOLD),
                    ft.Container(expand=True),
                    ft.Text("实时同步中", color=ft.colors.GREEN_400, size=12, weight=ft.FontWeight.BOLD)
                ]),
                ft.ListView(
                    controls=[
                        self._build_log_item("10:42:05", "坐席-001", "检测到敏感词 '不耐烦'", "高危"),
                        self._build_log_item("10:41:55", "坐席-007", "触发窗口抖动提醒", "中危"),
                        self._build_log_item("10:40:12", "系统", "新设备硬件指纹授权成功", "信息"),
                        self._build_log_item("10:38:00", "坐席-003", "登录 IP: 192.168.1.105", "信息"),
                    ],
                    height=200,
                    spacing=10
                )
            ]),
            bgcolor="#1c232e",
            padding=20,
            border_radius=10,
            border=ft.border.all(1, ft.colors.WHITE10),
            expand=True
        )

        return ft.Column(
            controls=[
                ft.Text("管理控制台概览", size=24, weight=ft.FontWeight.BOLD),
                command_bar,
                kpi_row,
                chart_section,
                log_section
            ],
            scroll=ft.ScrollMode.AUTO,
            expand=True,
            spacing=20
        )
            controls=[
                self._build_kpi_card("Online Agents", "24", ft.icons.PEOPLE, ft.colors.BLUE_400),
                self._build_kpi_card("Today Violations", "128", ft.icons.WARNING_AMBER, ft.colors.RED_400),
                self._build_kpi_card("Pending Alerts", "3", ft.icons.NOTIFICATIONS_ACTIVE, ft.colors.ORANGE_400),
                self._build_kpi_card("System Health", "98%", ft.icons.MONITOR_HEART, ft.colors.GREEN_400),
            ],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN
        )

        # 2. Main Charts Area
        chart_section = ft.Container(
            content=ft.Row(
                controls=[
                    # Violation Trend Chart
                    ft.Container(
                        content=ft.Column([
                            ft.Text("Violation Trend (24h)", size=16, weight=ft.FontWeight.BOLD),
                            self._build_line_chart()
                        ]),
                        expand=2,
                        bgcolor="#1c232e",
                        padding=20,
                        border_radius=10,
                        border=ft.border.all(1, ft.colors.WHITE10)
                    ),
                    # Risk Distribution Pie (Simulated with Progress Rings)
                    ft.Container(
                        content=ft.Column([
                            ft.Text("Risk Distribution", size=16, weight=ft.FontWeight.BOLD),
                            ft.Divider(color=ft.colors.TRANSPARENT, height=20),
                            self._build_risk_ring("Scam/Fraud", 0.65, ft.colors.RED_500),
                            self._build_risk_ring("Rudeness", 0.25, ft.colors.ORANGE_500),
                            self._build_risk_ring("Privacy", 0.10, ft.colors.BLUE_500),
                        ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                        expand=1,
                        bgcolor="#1c232e",
                        padding=20,
                        border_radius=10,
                        border=ft.border.all(1, ft.colors.WHITE10)
                    )
                ],
                spacing=20
            ),
            height=300
        )

        # 3. Real-time Live Log
        log_section = ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(ft.icons.HISTORY, color=ft.colors.BLUE_200),
                    ft.Text("Real-time Audit Logs", size=16, weight=ft.FontWeight.BOLD),
                    ft.Container(expand=True),
                    ft.Text("Live", color=ft.colors.GREEN_400, size=12, weight=ft.FontWeight.BOLD)
                ]),
                ft.ListView(
                    controls=[
                        self._build_log_item("10:42:05", "Agent-001", "Keyword 'refund now' detected", "High"),
                        self._build_log_item("10:41:55", "Agent-007", "Window shake triggered", "Medium"),
                        self._build_log_item("10:40:12", "System", "New hardware fingerprint authorized", "Info"),
                        self._build_log_item("10:38:00", "Agent-003", "Login from 192.168.1.105", "Info"),
                    ],
                    height=200,
                    spacing=10
                )
            ]),
            bgcolor="#1c232e",
            padding=20,
            border_radius=10,
            border=ft.border.all(1, ft.colors.WHITE10),
            expand=True
        )

        return ft.Column(
            controls=[
                ft.Text("Dashboard Overview", size=24, weight=ft.FontWeight.BOLD),
                kpi_row,
                chart_section,
                log_section
            ],
            scroll=ft.ScrollMode.AUTO,
            expand=True,
            spacing=20
        )

    def _build_kpi_card(self, title, value, icon, color):
        return ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(icon, color=color, size=24),
                    padding=12,
                    bgcolor=ft.colors.with_opacity(0.05, color),
                    border_radius=12,
                    border=ft.border.all(1, ft.colors.with_opacity(0.1, color))
                ),
                ft.Column([
                    ft.Text(title, size=11, color=ft.colors.GREY_500, weight=ft.FontWeight.W_500),
                    ft.Row([
                        ft.Text(value, size=24, weight=ft.FontWeight.BOLD, color=ft.colors.WHITE),
                        ft.Container(width=8, height=8, bgcolor=color, border_radius=10, animate_opacity=300) # Status Light
                    ], spacing=10, vertical_alignment=ft.CrossAxisAlignment.CENTER)
                ], spacing=0)
            ]),
            bgcolor="#141e2a",
            padding=15,
            border_radius=15,
            width=230,
            border=ft.border.all(1, ft.colors.WHITE10),
            shadow=ft.BoxShadow(blur_radius=10, color=ft.colors.with_opacity(0.2, ft.colors.BLACK))
        )

    def _build_line_chart(self):
        # Simplified chart for demo
        return ft.LineChart(
            data_series=[
                ft.LineChartData(
                    data_points=[
                        ft.LineChartDataPoint(0, 10),
                        ft.LineChartDataPoint(2, 40),
                        ft.LineChartDataPoint(4, 25),
                        ft.LineChartDataPoint(6, 80),
                        ft.LineChartDataPoint(8, 50),
                        ft.LineChartDataPoint(10, 90),
                    ],
                    stroke_width=3,
                    color=ft.colors.BLUE_400,
                    curved=True,
                    stroke_cap_round=True,
                )
            ],
            border=ft.border.all(0, ft.colors.TRANSPARENT),
            horizontal_grid_lines=ft.ChartGridLines(color=ft.colors.WHITE10),
            vertical_grid_lines=ft.ChartGridLines(color=ft.colors.TRANSPARENT),
            left_axis=ft.ChartAxis(labels_size=40, title=ft.Text("Alerts", size=10)),
            bottom_axis=ft.ChartAxis(labels_size=40, title=ft.Text("Time (h)", size=10)),
            tooltip_bgcolor=ft.colors.with_opacity(0.8, ft.colors.BLACK),
            expand=True,
        )

    def _build_risk_ring(self, label, percentage, color):
        return ft.Row([
            ft.Text(label, size=12, width=80),
            ft.ProgressBar(value=percentage, color=color, bgcolor=ft.colors.WHITE10, expand=True),
            ft.Text(f"{int(percentage*100)}%", size=12, width=40)
        ])

    def _build_log_item(self, time, user, action, level):
        color_map = {"High": ft.colors.RED, "Medium": ft.colors.ORANGE, "Info": ft.colors.BLUE}
        return ft.Container(
            content=ft.Row([
                ft.Text(time, size=12, color=ft.colors.GREY_500, width=60),
                ft.Text(user, size=12, weight=ft.FontWeight.BOLD, width=80),
                ft.Text(action, size=12, expand=True),
                ft.Container(
                    content=ft.Text(level, size=10, color=ft.colors.WHITE),
                    bgcolor=color_map.get(level, ft.colors.GREY),
                    padding=ft.padding.symmetric(horizontal=8, vertical=2),
                    border_radius=4
                )
            ]),
            padding=5,
            border=ft.border.only(bottom=ft.BorderSide(1, ft.colors.WHITE10))
        )
