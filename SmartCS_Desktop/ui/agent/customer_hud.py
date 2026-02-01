import flet as ft
import requests
import threading
import time
import pyperclip # We need this for sniffing, flet.page.get_clipboard is async/ui bound

class CustomerHUD(ft.Control):
    def __init__(self, page: ft.Page, agent_id: str, department: str):
        super().__init__()
        self.page = page
        self.agent_id = agent_id
        self.department = department
        self.api_url = "http://localhost:8000/api"
        self.last_clipboard = ""
        self.is_sniffing = True
        
        # --- UI Components ---
        
        # 1. Header (Avatar + Basic Info)
        self.avatar = ft.CircleAvatar(
            foreground_image_src="https://via.placeholder.com/150", 
            radius=25,
            content=ft.Text("?")
        )
        self.name_text = ft.Text("Unknown", size=16, weight=ft.FontWeight.BOLD)
        self.level_badge = ft.Container(
            content=ft.Text("Lv0", size=10, color=ft.colors.BLACK, weight=ft.FontWeight.BOLD),
            bgcolor=ft.colors.GREY, padding=5, border_radius=4
        )
        
        # 2. Metrics (LTV / Returns)
        self.metrics_row = ft.Row([
            self._build_metric("LTV", "¥0", ft.colors.GREEN_400),
            self._build_metric("Return Rate", "0%", ft.colors.RED_400),
        ], alignment=ft.MainAxisAlignment.SPACE_AROUND)
        
        # 3. Content Tabs
        self.tags_view = ft.Row(wrap=True, spacing=5)
        self.orders_view = ft.ListView(height=100, spacing=2)
        
        self.tabs = ft.Tabs(
            selected_index=0,
            height=150,
            tabs=[
                ft.Tab(text="Tags", content=ft.Container(content=self.tags_view, padding=10)),
                ft.Tab(text="Orders", content=self.orders_view),
            ]
        )

        # 4. Search & Add
        self.search_field = ft.TextField(
            hint_text="Search ID...", height=30, text_size=12, 
            on_submit=self.fetch_tags, bgcolor="#2b2d31", border_color=ft.colors.TRANSPARENT
        )
        self.add_tag_field = ft.TextField(
            hint_text="+ Tag (/g global)", height=30, text_size=12, 
            on_submit=self.add_tag, visible=False
        )

        self.container = ft.Container(
            content=ft.Column([
                ft.Row([ft.Text("👤 360° Persona", size=12, color=ft.colors.CYAN_200), self.search_field], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(height=1, color=ft.colors.WHITE10),
                ft.Row([
                    self.avatar,
                    ft.Column([
                        ft.Row([self.name_text, self.level_badge]),
                        self.metrics_row
                    ], expand=True)
                ]),
                self.tabs,
                self.add_tag_field
            ]),
            width=320,
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.CYAN_700),
            border_radius=12,
            padding=15,
            shadow=ft.BoxShadow(blur_radius=20, color=ft.colors.BLACK),
            visible=False,
            left=20, top=20,
            animate_opacity=300
        )
        
        # Start Sniffer
        threading.Thread(target=self._clipboard_loop, daemon=True).start()

    def build(self):
        return ft.Container()

    def _build_metric(self, label, value, color):
        return ft.Column([
            ft.Text(label, size=10, color=ft.colors.GREY_500),
            ft.Text(value, size=14, weight=ft.FontWeight.BOLD, color=color)
        ], spacing=0)

    def toggle(self):
        self.container.visible = not self.container.visible
        self.page.update()

    def fetch_tags(self, e=None):
        cust_id = self.search_field.value
        self._load_data(cust_id)

    def _load_data(self, cust_id):
        if not cust_id: return
        try:
            res = requests.get(
                f"{self.api_url}/customers/info", 
                params={"external_id": cust_id, "agent_id": self.agent_id, "dept": self.department}
            )
            if res.status_code == 200:
                data = res.json()
                if data["found"]:
                    self.name_text.value = data["name"]
                    self.avatar.foreground_image_src = data.get("avatar") or "https://via.placeholder.com/150"
                    
                    # Update Metrics
                    self.level_badge.content.value = data.get("level", "Lv1")
                    if data.get("level") == "Lv5": self.level_badge.bgcolor = ft.colors.AMBER
                    
                    self.metrics_row.controls[0].controls[1].value = f"¥{data.get('ltv', 0)}"
                    self.metrics_row.controls[1].controls[1].value = f"{int(data.get('return_rate', 0)*100)}%"
                    
                    self.show_tags(data["tags"])
                    self.show_orders(data.get("orders", []))
                    self.add_tag_field.visible = True
                else:
                    self.name_text.value = "New User"
                    self.add_tag_field.visible = True
                self.page.update()
        except Exception as err:
            print(f"Fetch Error: {err}")

    def show_tags(self, tags):
        self.tags_view.controls.clear()
        for t in tags:
            color = ft.colors.BLUE_200
            if t['type'] == 'Global': color = ft.colors.RED_400
            self.tags_view.controls.append(
                ft.Container(content=ft.Text(t['text'], size=10, color=ft.colors.BLACK), bgcolor=color, padding=5, border_radius=4)
            )

    def show_orders(self, orders):
        self.orders_view.controls.clear()
        for o in orders:
            self.orders_view.controls.append(
                ft.ListTile(
                    title=ft.Text(o['item'], size=12),
                    subtitle=ft.Text(o['date'], size=10),
                    trailing=ft.Text(o['status'], size=10, color=ft.colors.GREEN if o['status']=='Completed' else ft.colors.RED),
                    dense=True
                )
            )

    def add_tag(self, e):
        tag_text = self.add_tag_field.value
        if not tag_text: return
        tag_type = "Dept"
        if tag_text.startswith("/g "): 
            tag_type = "Global"
            tag_text = tag_text[3:]
        
        try:
            requests.post(f"{self.api_url}/customers/tag", json={
                "external_id": self.search_field.value,
                "tag_text": tag_text,
                "tag_type": tag_type,
                "agent_id": self.agent_id,
                "department": self.department
            })
            self.add_tag_field.value = ""
            self._load_data(self.search_field.value)
        except: pass

    def get_overlay_control(self):
        return self.container

    # --- Clipboard Sniffer ---
    def _clipboard_loop(self):
        # We need a robust cross-platform clipboard lib. 
        # flet's page.get_clipboard is async and tied to UI thread, harder to poll in bg thread.
        # 'pyperclip' is standard for this.
        while self.is_sniffing:
            try:
                content = pyperclip.paste()
                if content and content != self.last_clipboard:
                    self.last_clipboard = content
                    # Simple heuristic: is it a phone number?
                    if content.isdigit() and len(content) == 11:
                        # Auto-Search!
                        self.search_field.value = content
                        self._load_data(content)
                        # Auto-Show UI if hidden
                        if not self.container.visible:
                            self.container.visible = True
                            self.page.update()
            except:
                pass
            time.sleep(1.0)