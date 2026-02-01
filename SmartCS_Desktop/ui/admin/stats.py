import flet as ft
import requests

class StatsView(ft.Control):
    def __init__(self):
        super().__init__()
        self.api_url = "http://localhost:8000/api"

    def build(self):
        # We will fetch stats dynamically (Mock for now as backend stats API needs to be built)
        # But this view structure is what the user wants: By Dept, By Agent
        
        return ft.Container(
            content=ft.Column([
                ft.Text("Violation Analysis (BI)", size=24, weight=ft.FontWeight.BOLD),
                ft.Divider(),
                ft.Row([
                    self._build_chart_card("Violations by Dept", "BarChart"),
                    self._build_chart_card("Top 5 Risky Agents", "List")
                ], spacing=20, expand=True),
                ft.Container(height=20),
                ft.Text("Recent Evidence (Click to Review)", size=18, weight=ft.FontWeight.BOLD),
                self._build_evidence_gallery()
            ], scroll=ft.ScrollMode.AUTO),
            padding=20,
            expand=True
        )

    def _build_chart_card(self, title, type):
        # Placeholder for Charts
        content = ft.BarChart(
            data_series=[
                ft.BarChartGroup(x=0, bar_rods=[ft.BarChartRod(from_y=0, to_y=40, color=ft.colors.RED_400)]),
                ft.BarChartGroup(x=1, bar_rods=[ft.BarChartRod(from_y=0, to_y=25, color=ft.colors.ORANGE_400)]),
                ft.BarChartGroup(x=2, bar_rods=[ft.BarChartRod(from_y=0, to_y=10, color=ft.colors.BLUE_400)]),
            ],
            bottom_axis=ft.ChartAxis(labels=[ft.ChartAxisLabel(value=0, label=ft.Text("Sales")), ft.ChartAxisLabel(value=1, label=ft.Text("Support"))]),
            expand=True
        ) if type == "BarChart" else ft.ListView(
            controls=[
                ft.ListTile(title=ft.Text("Agent-007"), subtitle=ft.Text("12 Violations"), leading=ft.Icon(ft.icons.WARNING, color=ft.colors.RED)),
                ft.ListTile(title=ft.Text("Agent-009"), subtitle=ft.Text("8 Violations"), leading=ft.Icon(ft.icons.WARNING, color=ft.colors.ORANGE)),
            ]
        )

        return ft.Container(
            content=ft.Column([
                ft.Text(title, weight=ft.FontWeight.BOLD),
                ft.Container(content=content, height=200)
            ]),
            bgcolor="#1c232e",
            padding=20,
            border_radius=10,
            expand=True
        )

    def _build_evidence_gallery(self):
        # This would fetch from /api/audit/logs?has_image=true
        # Mocking for UI structure
        return ft.GridView(
            runs_count=4,
            spacing=10,
            run_spacing=10,
            controls=[
                self._build_evidence_item("Agent-007", "Scam detected", "https://via.placeholder.com/150"),
                self._build_evidence_item("Agent-003", "Rude words", "https://via.placeholder.com/150"),
            ]
        )

    def _build_evidence_item(self, agent, reason, url):
        return ft.Container(
            content=ft.Column([
                ft.Image(src=url, height=100, fit=ft.ImageFit.COVER, border_radius=5),
                ft.Text(agent, size=12, weight=ft.FontWeight.BOLD),
                ft.Text(reason, size=10, color=ft.colors.RED_200)
            ]),
            bgcolor="#2b2d31",
            padding=10,
            border_radius=5
        )
