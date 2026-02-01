import flet as ft

class HQDashboard(ft.UserControl):
    def __init__(self):
        super().__init__()

    def build(self):
        # 1. Company-wide KPIs
        kpi_row = ft.Row([
            self._build_kpi("Total Active Agents", "182/200", ft.icons.PEOPLE, ft.colors.BLUE_400),
            self._build_kpi("Group Violations", "24", ft.icons.GAVEL, ft.colors.RED_400),
            self._build_kpi("Avg. Satisfaction", "98.2%", ft.icons.STAR, ft.colors.AMBER_400),
            self._build_kpi("System Nodes", "4 Online", ft.icons.HUB, ft.colors.CYAN_400),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

        # 2. Department Comparison (Cross-Section)
        dept_chart = ft.Container(
            content=ft.Column([
                ft.Text("Department Risk Level Comparison", size=16, weight=ft.FontWeight.BOLD),
                ft.BarChart(
                    data_series=[
                        ft.BarChartGroup(x=0, bar_rods=[ft.BarChartRod(from_y=0, to_y=12, color=ft.colors.RED_400)]), # Sales
                        ft.BarChartGroup(x=1, bar_rods=[ft.BarChartRod(from_y=0, to_y=5, color=ft.colors.GREEN_400)]), # Support
                        ft.BarChartGroup(x=2, bar_rods=[ft.BarChartRod(from_y=0, to_y=8, color=ft.colors.ORANGE_400)]), # Tech
                    ],
                    bottom_axis=ft.ChartAxis(labels=[
                        ft.ChartAxisLabel(value=0, label=ft.Text("Sales")),
                        ft.ChartAxisLabel(value=1, label=ft.Text("Support")),
                        ft.ChartAxisLabel(value=2, label=ft.Text("Tech")),
                    ]),
                    expand=True
                )
            ]),
            bgcolor="#141e2a", padding=20, border_radius=15, height=300, expand=2
        )

        # 3. Global Real-time Ticker
        global_logs = ft.Container(
            content=ft.Column([
                ft.Text("Global Security Ticker", size=16, weight=ft.FontWeight.BOLD, color=ft.colors.CYAN_200),
                ft.ListView(spacing=5, height=200)
            ]),
            bgcolor="#141e2a", padding=20, border_radius=15, expand=1
        )

        return ft.Column([
            ft.Text("🏢 Smart-CS HQ Digital Cockpit", size=28, weight=ft.FontWeight.BOLD),
            ft.Text("Enterprise-wide Governance Insight", size=14, color=ft.colors.GREY_500),
            ft.Divider(height=20, color=ft.colors.TRANSPARENT),
            kpi_row,
            ft.Row([dept_chart, global_logs], spacing=20, expand=True)
        ], expand=True, spacing=10)

    def _build_kpi(self, title, value, icon, color):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, color=color, size=30),
                ft.Text(value, size=24, weight=ft.FontWeight.BOLD),
                ft.Text(title, size=12, color=ft.colors.GREY_500)
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
            bgcolor="#141e2a", padding=20, border_radius=15, width=220, border=ft.border.all(1, ft.colors.WHITE10)
        )
