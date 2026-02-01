import flet as ft
import requests

class ProductSearchOverlay(ft.UserControl):
    def __init__(self, page: ft.Page, department: str = "General"):
        super().__init__()
        self.page = page
        self.department = department
        self.api_url = "http://localhost:8000/api"
        self.is_visible = False
        
        # UI Components
        self.search_field = ft.TextField(
            hint_text=f"Search Product ({self.department})...",
            prefix_icon=ft.icons.SEARCH,
            height=40,
            text_size=14,
            content_padding=10,
            autofocus=True,
            on_change=self.on_search_change,
            border_color=ft.colors.TRANSPARENT,
            bgcolor=ft.colors.TRANSPARENT
        )
        
        self.results_list = ft.ListView(
            spacing=5, 
            padding=5, 
            height=250, 
            visible=False
        )
        
        self.container = ft.Container(
            content=ft.Column([
                ft.Container(
                    content=self.search_field,
                    bgcolor="#2b2d31",
                    border_radius=8
                ),
                self.results_list
            ], spacing=5),
            width=400,
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.WHITE24),
            border_radius=12,
            padding=10,
            shadow=ft.BoxShadow(blur_radius=30, color=ft.colors.BLACK),
            visible=False,
            left=25,
            top=60 
        )

    def build(self):
        return ft.Container()

    def toggle(self, e=None):
        self.is_visible = not self.is_visible
        self.container.visible = self.is_visible
        self.results_list.visible = False
        self.search_field.value = ""
        self.page.update()
        if self.is_visible:
            self.search_field.focus()

    def on_search_change(self, e):
        query = e.control.value
        if len(query) < 1:
            self.results_list.visible = False
            self.page.update()
            return
            
        try:
            # Pass Dept Isolation
            res = requests.get(f"{self.api_url}/products/search", params={"q": query, "dept": self.department})
            if res.status_code == 200:
                products = res.json()
                self.show_results(products)
        except Exception as err:
            print(f"Search Error: {err}")

    def show_results(self, products):
        self.results_list.controls.clear()
        
        if not products:
            self.results_list.controls.append(ft.Text("No products found", color=ft.colors.GREY))
        else:
            for p in products:
                self.results_list.controls.append(
                    self._build_product_item(p)
                )
        
        self.results_list.visible = True
        self.page.update()

    def _build_product_item(self, p):
        quote_text = f"【{p['name']}】\n规格：{p['specs']}\n价格：¥{p['price']}\n卖点：{p['selling_points']}"
        
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text(p['name'], weight=ft.FontWeight.BOLD, expand=True),
                    ft.Text(f"¥{p['price']}", color=ft.colors.AMBER_400, weight=ft.FontWeight.BOLD)
                ]),
                ft.Row([
                    ft.Text(f"Stock: {p['stock']}", size=10, color=ft.colors.GREY_400),
                    ft.Text(f"SKU: {p['sku']}", size=10, color=ft.colors.GREY_400)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Text(p['selling_points'], size=11, color=ft.colors.CYAN_200, no_wrap=True, overflow=ft.TextOverflow.ELLIPSIS)
            ]),
            padding=8,
            border_radius=6,
            bgcolor=ft.colors.WHITE10,
            on_hover=lambda e: self._on_hover_item(e),
            on_click=lambda e: self._on_click_item(quote_text),
            tooltip="Click to Copy Quote"
        )

    def _on_hover_item(self, e):
        e.control.bgcolor = ft.colors.WHITE24 if e.data == "true" else ft.colors.WHITE10
        e.control.update()

    def _on_click_item(self, text):
        self.page.set_clipboard(text)
        self.page.snack_bar = ft.SnackBar(ft.Text("Product Quote Copied!"))
        self.page.snack_bar.open = True
        self.toggle()
        self.page.update()

    def get_overlay_control(self):
        return self.container