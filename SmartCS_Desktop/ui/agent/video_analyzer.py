import flet as ft
from core.ai_service import AIService

class VideoAnalyzer(ft.UserControl):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.ai = AIService()
        self.is_visible = False
        
        self.drop_zone = ft.Container(
            content=ft.Column([
                ft.Icon(ft.icons.VIDEO_FILE, size=40, color=ft.colors.CYAN_200),
                ft.Text("拖入视频 / 点击分析", size=12, color=ft.colors.CYAN_100),
                ft.Text("支持 MP4, MOV (模拟)", size=10, color=ft.colors.GREY_500)
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
            width=280,
            height=120,
            bgcolor=ft.colors.WHITE10,
            border=ft.border.all(1, ft.colors.CYAN_800, style=ft.BorderStyle.DASHED),
            border_radius=10,
            alignment=ft.alignment.center,
            on_click=self.analyze_video
        )
        
        self.result_text = ft.Text("", size=12, color=ft.colors.GREEN_200)
        
        self.container = ft.Container(
            content=ft.Column([
                ft.Text("🎬 视频智能总结 (Video Gist)", size=12, weight=ft.FontWeight.BOLD),
                self.drop_zone,
                self.result_text
            ]),
            width=320,
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.CYAN_700),
            border_radius=12,
            padding=15,
            shadow=ft.BoxShadow(blur_radius=20, color=ft.colors.BLACK),
            visible=False,
            left=380, top=200
        )

    def build(self):
        return ft.Container()

    def toggle(self):
        self.is_visible = not self.is_visible
        self.container.visible = self.is_visible
        self.page.update()

    def analyze_video(self, e):
        self.drop_zone.content.controls[1].value = "正在逐帧分析中 (AI Vision)..."
        self.drop_zone.update()
        
        # Simulate Processing Delay
        def process():
            time.sleep(1.5)
            summary = self.ai.summarize_video("dummy_path.mp4")
            self.result_text.value = summary
            self.drop_zone.content.controls[1].value = "分析完成"
            self.drop_zone.bgcolor = ft.colors.GREEN_900
            self.container.update()
            
        import threading
        threading.Thread(target=process).start()

    def get_overlay_control(self):
        return self.container
