import flet as ft

class TacticalButton(ft.Control):
    def __init__(self, icon, color, tooltip, on_click, hotkey_text=""):
        super().__init__()
        self.icon = icon
        self.color = color
        self.tooltip = tooltip
        self.on_click = on_click
        self.hotkey_text = hotkey_text
        self.is_active = False

    def build(self):
        self.container = ft.Container(
            content=ft.Icon(self.icon, size=18, color=self.color),
            width=36,
            height=36,
            border_radius=8,
            alignment=ft.alignment.center,
            on_click=self._handle_click,
            on_hover=self._handle_hover,
            tooltip=f"{self.tooltip} ({self.hotkey_text})" if self.hotkey_text else self.tooltip,
            animate=ft.animation.Animation(200, ft.AnimationCurve.EASE_OUT),
            border=ft.border.all(1, ft.colors.WHITE10),
        )
        return self.container

    def _handle_hover(self, e):
        if not self.is_active:
            e.control.bgcolor = ft.colors.WHITE10 if e.data == "true" else ft.colors.TRANSPARENT
            e.control.border = ft.border.all(1, ft.colors.with_opacity(0.3, self.color) if e.data == "true" else ft.colors.WHITE10)
            e.control.scale = 1.1 if e.data == "true" else 1.0
            e.control.update()

    def _handle_click(self, e):
        # Trigger parent event
        if self.on_click:
            self.on_click(e)

    def set_active(self, active: bool):
        self.is_active = active
        self.container.bgcolor = ft.colors.with_opacity(0.2, self.color) if active else ft.colors.TRANSPARENT
        self.container.border = ft.border.all(1, self.color if active else ft.colors.WHITE10)
        self.container.shadow = ft.BoxShadow(blur_radius=10, color=self.color) if active else None
        self.update()
