import flet as ft
from datetime import datetime

class DataCockpit(ft.UserControl):
    def __init__(self):
        super().__init__()

    def build(self):
        # 1. Top KPI Cards
        kpi_row = ft.Row(
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
