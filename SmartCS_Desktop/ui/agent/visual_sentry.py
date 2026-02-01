import flet as ft
import base64
import time
import threading
import requests
from io import BytesIO
from PIL import ImageGrab

class VisualSentry(ft.Control):
    def __init__(self, page: ft.Page, agent_id: str, on_keyword_found=None):
        super().__init__()
        self.page = page
        self.agent_id = agent_id
        self.on_keyword_found = on_keyword_found
        self.is_monitoring = False
        self.roi = None # (left, top, width, height)
        self.api_url = "http://localhost:8000/api"

        # UI Components
        self.monitor_btn = ft.IconButton(
            icon=ft.icons.VISIBILITY, 
            tooltip="Set Monitor Area (Visual Sentry)",
            icon_color=ft.colors.CYAN_400,
            on_click=self.toggle_setup_mode
        )
        
        # Selection Window (Overlay)
        self.selector_window = None

    def build(self):
        return self.monitor_btn

    def toggle_setup_mode(self, e):
        if self.is_monitoring:
            self.stop_monitoring()
            self.monitor_btn.icon = ft.icons.VISIBILITY
            self.monitor_btn.icon_color = ft.colors.CYAN_400
            self.monitor_btn.tooltip = "Start Visual Sentry"
            self.page.update()
        else:
            # Start Selection Mode (Simulated by defining a fixed central box for demo, 
            # or we could make a transparent window follow mouse, but Flet limitations make drag-select hard)
            # For this Demo: We assume the user wants to monitor the center of the screen
            self.start_monitoring((500, 300, 400, 300))
            self.monitor_btn.icon = ft.icons.VISIBILITY_OFF
            self.monitor_btn.icon_color = ft.colors.RED_400
            self.monitor_btn.tooltip = "Stop Monitoring"
            self.page.update()
            
            self.page.snack_bar = ft.SnackBar(ft.Text("Visual Sentry Active: Monitoring screen center..."))
            self.page.snack_bar.open = True
            self.page.update()

    def start_monitoring(self, roi):
        self.roi = roi
        self.is_monitoring = True
        # Start background thread
        threading.Thread(target=self._monitor_loop, daemon=True).start()

    def stop_monitoring(self):
        self.is_monitoring = False

    def _monitor_loop(self):
        print("👁️ Visual Sentry Started")
        while self.is_monitoring:
            try:
                # 1. Capture ROI
                # bbox = (left, top, right, bottom)
                bbox = (self.roi[0], self.roi[1], self.roi[0]+self.roi[2], self.roi[1]+self.roi[3])
                screenshot = ImageGrab.grab(bbox=bbox)
                
                # 2. Encode
                buffered = BytesIO()
                screenshot.save(buffered, format="JPEG", quality=50)
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                
                # 3. Send to Server for OCR
                res = requests.post(
                    f"{self.api_url}/monitor/ocr",
                    json={"agent_id": self.agent_id, "image_base64": img_str},
                    timeout=2
                )
                
                if res.status_code == 200:
                    data = res.json()
                    keywords = data.get("keywords", [])
                    if keywords and self.on_keyword_found:
                        # Found something!
                        print(f"👁️ Visual Match: {keywords}")
                        for kw in keywords:
                            self.on_keyword_found(kw)
                            
            except Exception as e:
                # print(f"Monitor Error: {e}")
                pass
            
            # Scan interval (e.g., every 3 seconds to save CPU)
            time.sleep(3)
