import flet as ft
import requests
import base64
from io import BytesIO
from PIL import ImageGrab

class IntelliHelper(ft.UserControl):
    def __init__(self, page: ft.Page, agent_id: str):
        super().__init__()
        self.page = page
        self.agent_id = agent_id
        self.api_url = "http://localhost:8000/api"
        
        # UI: Suggestions Popup (Hidden by default)
        self.suggestions_lv = ft.ListView(height=0, spacing=5, padding=10)
        self.suggestion_card = ft.Container(
            content=ft.Column([
                ft.Text("💡 AI Suggestions", size=10, weight=ft.FontWeight.BOLD, color=ft.colors.YELLOW_400),
                self.suggestions_lv
            ]),
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.YELLOW_600),
            border_radius=10,
            padding=10,
            width=250,
            visible=False,
            shadow=ft.BoxShadow(blur_radius=10, color=ft.colors.BLACK)
        )

    def build(self):
        # We don't return the suggestion card here directly, 
        # it is meant to be added to the Overlay of the page
        return ft.Container() # Placeholder

    def trigger_suggestion(self, keyword):
        """Called when Hook detects input. Queries Server."""
        try:
            res = requests.get(f"{self.api_url}/knowledge/search", params={"q": keyword})
            if res.status_code == 200:
                results = res.json()
                if results:
                    self.show_suggestions(results)
        except Exception as e:
            print(f"Suggestion Error: {e}")

    def show_suggestions(self, results):
        self.suggestions_lv.controls.clear()
        for res in results:
            self.suggestions_lv.controls.append(
                ft.Container(
                    content=ft.Column([
                        ft.Text(res['question'], size=12, weight=ft.FontWeight.BOLD),
                        ft.Text(res['answer'], size=10, color=ft.colors.GREY_400, no_wrap=True, overflow=ft.TextOverflow.ELLIPSIS),
                    ]),
                    padding=5,
                    bgcolor=ft.colors.WHITE10,
                    border_radius=5,
                    on_click=lambda e, txt=res['answer']: self.copy_to_clipboard(txt)
                )
            )
        
        self.suggestions_lv.height = min(len(results) * 50 + 20, 200)
        self.suggestion_card.visible = True
        self.suggestion_card.update()

    def hide_suggestions(self):
        self.suggestion_card.visible = False
        self.suggestion_card.update()

    def copy_to_clipboard(self, text):
        self.page.set_clipboard(text)
        self.hide_suggestions()
        self.page.snack_bar = ft.SnackBar(ft.Text("Copied to clipboard!"))
        self.page.snack_bar.open = True
        self.page.update()

    def send_help_request(self):
        """Captures screen and sends to server"""
        try:
            # 1. Capture Screen
            screenshot = ImageGrab.grab()
            buffered = BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            # 2. Send API Request
            payload = {
                "agent_id": self.agent_id,
                "description": "Agent initiated urgent help request",
                "screenshot_base64": img_str
            }
            res = requests.post(f"{self.api_url}/agent/help", json=payload)
            
            if res.status_code == 200:
                return True
            else:
                print(f"API Error: {res.text}")
                return False
        except Exception as e:
            print(f"Help Request Error: {e}")
            return False

    def get_overlay_control(self):
        """Returns the suggestion card to be placed in page.overlay"""
        return self.suggestion_card
