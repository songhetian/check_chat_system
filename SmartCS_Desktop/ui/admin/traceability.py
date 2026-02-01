import flet as ft

class TraceabilityView(ft.UserControl):
    def __init__(self):
        super().__init__()

    def build(self):
        # 1. Video/Image Player Area (Mockup using Image for now)
        self.player_container = ft.Container(
            content=ft.Stack([
                ft.Image(
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWmEGrIcP0MT2366na1ym8-X8YIbskDzz5bZJJJ6bl-oncVj7MP7bf56Y_fJWlXTF4AkAJqODJ1ZHpMKs5PntIdaPzJOq0PHliPEZXjYo8nvw_ZvsPxhn5q9OPO8-uoujeJVKbOj18QCLoMjp-vYkqg-D-wS2CL_b0BJMBn1KIn-L47eitNCXaKRzhbgXAVwbIZJvo9uTX_QKplW7S-upzneaweOWoFkpzf3bciD8ovLUxDKJ-I_8F7ffN2s6JbJu99usHMeufYYr-",
                    fit=ft.ImageFit.COVER,
                    opacity=0.6
                ),
                ft.Column([
                    ft.Icon(ft.icons.PLAY_CIRCLE_OUTLINE, color=ft.colors.WHITE, size=80),
                    ft.Text("Playback Evidence", color=ft.colors.WHITE, weight=ft.FontWeight.BOLD)
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
            ]),
            bgcolor=ft.colors.BLACK,
            aspect_ratio=16/9,
            border_radius=10,
            alignment=ft.alignment.center,
            border=ft.border.all(1, ft.colors.WHITE10)
        )

        # 2. Details Panel
        self.details_panel = ft.Container(
            content=ft.Column([
                ft.Text("Violation Details", size=20, weight=ft.FontWeight.BOLD),
                ft.Divider(color=ft.colors.WHITE10),
                self._build_detail_row("Event Time", "2023-10-24 14:20:05"),
                self._build_detail_row("Agent ID", "Agent-9921"),
                self._build_detail_row("Trigger", "Sensitive Word (Refund)"),
                ft.Divider(color=ft.colors.WHITE10),
                ft.Text("Keywords Detected", size=14, color=ft.colors.GREY_400),
                ft.Row([
                    ft.Chip(label=ft.Text("#Refund_Now"), bgcolor=ft.colors.RED_900),
                    ft.Chip(label=ft.Text("#Scam"), bgcolor=ft.colors.RED_900),
                ]),
                ft.Container(height=20),
                ft.Row([
                    ft.ElevatedButton("False Positive", icon=ft.icons.THUMB_UP, color=ft.colors.GREEN),
                    ft.ElevatedButton("Confirm Violation", icon=ft.icons.GAVEL, bgcolor=ft.colors.RED_700, color=ft.colors.WHITE),
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)
            ]),
            padding=20,
            bgcolor="#1c232e",
            border_radius=10
        )

        return ft.Row(
            controls=[
                ft.Container(content=self.player_container, expand=2),
                ft.Container(content=self.details_panel, expand=1)
            ],
            spacing=20,
            vertical_alignment=ft.CrossAxisAlignment.START
        )

    def _build_detail_row(self, label, value):
        return ft.Row([
            ft.Text(label, width=100, color=ft.colors.GREY_400),
            ft.Text(value, weight=ft.FontWeight.BOLD)
        ], spacing=10)
