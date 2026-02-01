import flet as ft
import random

class TonePolisher(ft.UserControl):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.is_visible = False
        
        # Mock AI Database
        self.polish_map = {
            "不管": "非常抱歉给您带来困扰，这个问题稍微超出了我的权限范围，不过请放心，我会帮您...",
            "退款": "亲，这边完全理解您的心情。关于退款流程，我们需要先核实一下...",
            "太贵": "产品的品质和价格是成正比的呢，虽然价格稍高，但我们提供了5年质保...",
            "发货": "好消息！您的宝贝已经整装待发，预计今天下午就能发出...",
            "default": "（AI 正在重新组织语言，使其更加委婉专业...）"
        }

        # UI Components
        self.input_field = ft.TextField(
            hint_text="输入粗略意图 (e.g. 太贵)...",
            height=40,
            text_size=14,
            content_padding=10,
            bgcolor="#2b2d31",
            border_color=ft.colors.TRANSPARENT,
            on_submit=self.run_polish,
            autofocus=True
        )
        
        self.result_area = ft.Container(
            content=ft.Text("✨ AI Ready", color=ft.colors.GREY_500, size=12),
            padding=10,
            bgcolor=ft.colors.BLACK26,
            border_radius=5,
            visible=False,
            on_click=self.copy_result,
            tooltip="Click to Copy"
        )

        self.container = ft.Container(
            content=ft.Column([
                ft.Text("🧬 AI Tone Polisher (话术外骨骼)", size=12, weight=ft.FontWeight.BOLD, color=ft.colors.PURPLE_200),
                self.input_field,
                self.result_area,
                ft.ElevatedButton("润色 (Polish)", on_click=self.run_polish, height=30, style=ft.ButtonStyle(bgcolor=ft.colors.PURPLE_700, color=ft.colors.WHITE))
            ], spacing=10),
            width=300,
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.PURPLE_500),
            border_radius=12,
            padding=15,
            shadow=ft.BoxShadow(blur_radius=30, color=ft.colors.BLACK),
            visible=False,
            left=380, # Position to the right of the island
            top=20
        )

    def build(self):
        return ft.Container()

    def toggle(self, e=None):
        self.is_visible = not self.is_visible
        self.container.visible = self.is_visible
        self.page.update()
        if self.is_visible:
            self.input_field.focus()

    def run_polish(self, e):
        raw_text = self.input_field.value
        if not raw_text: return
        
        # Mock AI Logic
        polished = self.polish_map.get(raw_text, f"亲，关于您提到的“{raw_text}”，我们是非常重视的。我们可以为您提供专属方案...")
        
        self.result_area.content = ft.Text(polished, size=13, color=ft.colors.WHITE)
        self.result_area.visible = True
        self.result_area.data = polished # Store for copy
        self.page.update()

    def copy_result(self, e):
        if self.result_area.data:
            self.page.set_clipboard(self.result_area.data)
            self.page.snack_bar = ft.SnackBar(ft.Text("Polished text copied!"))
            self.page.snack_bar.open = True
            self.toggle() # Close
            self.page.update()

    def get_overlay_control(self):
        return self.container
