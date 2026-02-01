import flet as ft

class MiniTask(ft.Control):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.is_visible = False
        
        self.input = ft.TextField(hint_text="Add task...", height=30, text_size=12, on_submit=self.add_task)
        self.list = ft.ListView(height=150, spacing=2)
        
        self.container = ft.Container(
            content=ft.Column([
                ft.Text("📝 Todo List", size=12, weight=ft.FontWeight.BOLD),
                self.input,
                self.list
            ]),
            width=200,
            bgcolor="#1c1c1e",
            border=ft.border.all(1, ft.colors.ORANGE_700),
            border_radius=10,
            padding=10,
            visible=False,
            left=20, bottom=80
        )

    def build(self):
        return ft.Container()

    def toggle(self):
        self.is_visible = not self.is_visible
        self.container.visible = self.is_visible
        self.page.update()
        if self.is_visible: self.input.focus()

    def add_task(self, e):
        if not self.input.value: return
        
        task_text = self.input.value
        self.list.controls.append(
            ft.Checkbox(label=task_text, label_style=ft.TextStyle(size=12), on_change=lambda e: self.remove_task(e.control))
        )
        self.input.value = ""
        self.page.update()

    def remove_task(self, task_control):
        time.sleep(0.5)
        if task_control in self.list.controls:
            self.list.controls.remove(task_control)
            self.page.update()

    def get_overlay_control(self):
        return self.container
