import flet as ft
import requests

class GuidanceOverlay(ft.UserControl):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.api_url = "http://localhost:8000/api"
        self.local_rules = {} # Cache: {'退货': {title, content, image}}
        self.current_snack = None

        # Fetch rules on init
        self.fetch_rules()

    def fetch_rules(self):
        try:
            # In V9.5, use the server_url from config
            # For now hardcoded for demo simplicity, or pass in __init__
            res = requests.get(f"{self.api_url}/guidance/all")
            if res.status_code == 200:
                data = res.json()
                self.local_rules = {item['keyword']: item for item in data}
                print(f"Loaded {len(self.local_rules)} guidance rules.")
        except Exception as e:
            print(f"Failed to load guidance: {e}")

    def check_and_show(self, keyword):
        """Called by Hook Service"""
        rule = self.local_rules.get(keyword)
        if rule:
            self.show_guidance(rule)
            return True
        return False

    def show_guidance(self, rule):
        # We use a persistent Dialog or a styled Container in Overlay
        # Here we design a "Toast" style notification but persistent until closed
        
        content_controls = [
            ft.Text(rule['title'], size=16, weight=ft.FontWeight.BOLD, color=ft.colors.CYAN_200),
            ft.Divider(color=ft.colors.WHITE24),
            ft.Text(rule['content'], size=13, color=ft.colors.WHITE),
        ]
        
        if rule.get('image_url'):
            content_controls.append(
                ft.Image(src=rule['image_url'], width=300, height=150, fit=ft.ImageFit.CONTAIN, border_radius=5)
            )

        content_controls.append(
            ft.Row([
                ft.TextButton("我已知晓 (Got it)", on_click=self.close_guidance)
            ], alignment=ft.MainAxisAlignment.END)
        )

        self.card = ft.Container(
            content=ft.Column(content_controls, spacing=10, tight=True),
            width=350,
            padding=15,
            bgcolor="#1c232e", # Admin dark theme color
            border=ft.border.all(1, ft.colors.CYAN_700),
            border_radius=10,
            shadow=ft.BoxShadow(blur_radius=20, color=ft.colors.BLACK),
            animate_opacity=300,
        )
        
        # Add to overlay
        # First remove old one if exists
        if hasattr(self, 'card_ref') and self.card_ref in self.page.overlay:
            self.page.overlay.remove(self.card_ref)
        
        self.card_ref = self.card
        self.page.overlay.append(self.card)
        self.card.left = 20
        self.card.top = 100 # Below the island
        self.page.update()

    def close_guidance(self, e):
        if hasattr(self, 'card_ref') and self.card_ref in self.page.overlay:
            self.page.overlay.remove(self.card_ref)
            self.page.update()

    def build(self):
        return ft.Container()
