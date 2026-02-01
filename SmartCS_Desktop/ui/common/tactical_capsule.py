import flet as ft
import time
import threading

class TacticalCapsule(ft.Control):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.state = "idle" 
        self.expanded = False
        
        # UI Components
        self.status_icon = ft.Icon(name=ft.icons.SHIELD_OUTLINED, color=ft.colors.BLUE_400, size=24)
        self.status_text = ft.Text("SYSTEM SECURE", size=12, weight=ft.FontWeight.BOLD, color=ft.colors.BLUE_100)
        self.detail_text = ft.Text("Active Monitoring", size=10, color=ft.colors.WHITE54, visible=False)
        self.action_row = ft.Row(visible=False, spacing=5)
        
        # Main Container with Glassmorphism
        self.container = ft.Container(
            width=200,
            height=50,
            bgcolor=ft.colors.with_opacity(0.7, "#1c1c1e"),
            blur=ft.Blur(15, 15, ft.BlurStyle.INNER), # GLASS EFFECT
            border_radius=ft.border_radius.all(25),
            border=ft.border.all(1, ft.colors.WHITE10),
            padding=ft.padding.only(left=15, right=15),
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=20,
                color=ft.colors.with_opacity(0.5, ft.colors.BLACK),
            ),
            animate=ft.animation.Animation(400, ft.AnimationCurve.DECELERATE),
            animate_opacity=500,
            on_hover=self._on_hover,
        )

    def build(self):
        return self.container

    def setup_layout(self):
        """Called after build to set content"""
        self.container.content = ft.Row(
            controls=[
                ft.Container(
                    content=self.status_icon,
                    padding=5,
                    border_radius=50,
                    bgcolor=ft.colors.with_opacity(0.1, self.status_icon.color),
                ),
                ft.Column([
                    self.status_text,
                    self.detail_text
                ], spacing=0, alignment=ft.MainAxisAlignment.CENTER, expand=True),
                self.action_row
            ],
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.CENTER,
        )

    def _on_hover(self, e):
        # Ghost Mode: Glow on hover
        if e.data == "true":
            self.container.opacity = 1.0
            self.container.border = ft.border.all(1, ft.colors.with_opacity(0.5, self.status_icon.color))
            if not self.expanded:
                self.container.width = 240
                self.detail_text.visible = True
        else:
            if self.state == "idle":
                self.container.opacity = 0.8 # Semi-transparent when idle
                self.container.width = 200
                self.detail_text.visible = False
                self.container.border = ft.border.all(1, ft.colors.WHITE10)
        self.update()

    def set_state(self, state_type: str, message: str = "", detail: str = ""):
        self.state = state_type
        self.container.opacity = 1.0 # Force bright on state change
        
        if state_type == "idle":
            self.status_icon.name = ft.icons.SHIELD_OUTLINED
            self.status_icon.color = ft.colors.BLUE_400
            self.status_text.value = "SYSTEM SECURE"
            self.status_text.color = ft.colors.BLUE_100
            self.action_row.visible = False
            self.container.width = 200
            
        elif state_type == "alert":
            self.status_icon.name = ft.icons.WARNING_ROUNDED
            self.status_icon.color = ft.colors.RED_ACCENT_400
            self.status_text.value = message or "ALERT"
            self.status_text.color = ft.colors.RED_50
            self.action_row.visible = True
            self.container.width = 450 # Expand for buttons
            self.expanded = True
            self._pulse()

        elif state_type == "assist":
            self.status_icon.name = ft.icons.AUTO_AWESOME
            self.status_icon.color = ft.colors.CYAN_400
            self.status_text.value = message
            self.action_row.visible = True
            self.container.width = 450
            self.expanded = True

        self.detail_text.value = detail
        self.detail_text.visible = True
        self.update()

    def _pulse(self):
        def run():
            for _ in range(4):
                if self.state != "alert": break
                self.container.border = ft.border.all(2, ft.colors.RED_700)
                self.update()
                time.sleep(0.4)
                self.container.border = ft.border.all(1, ft.colors.WHITE10)
                self.update()
                time.sleep(0.4)
        threading.Thread(target=run, daemon=True).start()