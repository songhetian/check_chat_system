import flet as ft

import requests
import json

class SettingsManager(ft.Control):
    def __init__(self):
        super().__init__()
        self.api_url = "http://localhost:8000/api"
        self.users = []
        self.departments = []
        
        # UI Refs
        self.staff_list = ft.Column(spacing=10, scroll=ft.ScrollMode.AUTO)
        self.dept_dropdown = ft.Dropdown(label="Select Department", width=200)

    def did_mount(self):
        # Initial load
        self.refresh_data()

    def refresh_data(self):
        try:
            # 1. Load Departments
            res_depts = requests.get(f"{self.api_url}/admin/departments")
            if res_depts.status_code == 200:
                self.departments = res_depts.json()
                self.dept_dropdown.options = [ft.dropdown.Option(str(d["id"]), d["name"]) for d in self.departments]
            
            # 2. Load Users
            res_users = requests.get(f"{self.api_url}/admin/users")
            if res_users.status_code == 200:
                self.users = res_users.json()
                self._update_staff_list()
            self.update()
        except Exception as e:
            print(f"Refresh failed: {e}")

    def _update_staff_list(self):
        self.staff_list.controls.clear()
        for user in self.users:
            dept_name = next((d["name"] for d in self.departments if d["id"] == user["department_id"]), "未知部门")
            status_text = "正常" if user["status"] == "Active" else "已停用"
            status_color = ft.colors.GREEN_400 if user["status"] == "Active" else ft.colors.RED_400
            
            self.staff_list.controls.append(
                ft.Container(
                    content=ft.Row([
                        ft.Icon(ft.icons.PERSON, color=ft.colors.BLUE_200),
                        ft.Column([
                            ft.Text(f"{user['real_name']} (@{user['username']})", weight=ft.FontWeight.BOLD),
                            ft.Text(f"部门: {dept_name} | 角色: {user['role']}", size=12, color=ft.colors.GREY_500),
                        ], spacing=2, expand=True),
                        ft.Container(
                            content=ft.Text(status_text, size=10, color=ft.colors.BLACK),
                            bgcolor=status_color, padding=5, border_radius=5
                        ),
                        ft.PopupMenuButton(
                            items=[
                                ft.PopupMenuItem(text="修改资料", icon=ft.icons.EDIT, on_click=lambda e, u=user: self._show_edit_dialog(u)),
                                ft.PopupMenuItem(text="重置密码", icon=ft.icons.LOCK_RESET),
                                ft.PopupMenuItem(text="停用/启用", icon=ft.icons.BLOCK, on_click=lambda e, u=user: self._toggle_user_status(u)),
                                ft.PopupMenuItem(text="彻底删除", icon=ft.icons.DELETE_FOREVER, on_click=lambda e, u=user: self._delete_user(u)),
                            ]
                        )
                    ]),
                    bgcolor=ft.colors.WHITE10, padding=15, border_radius=10
                )
            )

    def _show_add_user_dialog(self, e):
        # 对话框组件
        name_in = ft.TextField(label="真实姓名", width=300)
        user_in = ft.TextField(label="登录账号", width=300)
        pass_in = ft.TextField(label="初始密码", password=True, width=300)
        role_in = ft.Dropdown(label="角色", options=[
            ft.dropdown.Option("AGENT", "一线坐席"),
            ft.dropdown.Option("SUPERVISOR", "部门主管"),
            ft.dropdown.Option("HQ", "总部指挥")
        ], width=300, value="AGENT")
        dept_in = ft.Dropdown(label="所属部门", options=[
            ft.dropdown.Option(str(d["id"]), d["name"]) for d in self.departments
        ], width=300)

        def save_new_user(e):
            try:
                res = requests.post(f"{self.api_url}/admin/users", json={
                    "username": user_in.value,
                    "password": pass_in.value,
                    "real_name": name_in.value,
                    "role": role_in.value,
                    "department_id": int(dept_in.value)
                })
                if res.status_code == 200:
                    self.page.dialog.open = False
                    self.refresh_data()
            except: pass

        self.page.dialog = ft.AlertDialog(
            title=ft.Text("添加新成员"),
            content=ft.Column([name_in, user_in, pass_in, role_in, dept_in], tight=True, spacing=10),
            actions=[ft.TextButton("取消", on_click=lambda e: setattr(self.page.dialog, "open", False)), 
                     ft.ElevatedButton("创建账号", on_click=save_new_user)]
        )
        self.page.dialog.open = True
        self.page.update()

    def _toggle_user_status(self, user):
        new_status = "Suspended" if user["status"] == "Active" else "Active"
        requests.put(f"{self.api_url}/admin/users/{user['id']}", json={"status": new_status})
        self.refresh_data()

    def _delete_user(self, user):
        requests.delete(f"{self.api_url}/admin/users/{user['id']}")
        self.refresh_data()

    def _show_edit_dialog(self, user):
        name_in = ft.TextField(label="真实姓名", value=user["real_name"], width=300)
        def save_edit(e):
            requests.put(f"{self.api_url}/admin/users/{user['id']}", json={"real_name": name_in.value})
            self.page.dialog.open = False
            self.refresh_data()
        
        self.page.dialog = ft.AlertDialog(
            title=ft.Text("修改资料"),
            content=name_in,
            actions=[ft.ElevatedButton("保存修改", on_click=save_edit)]
        )
        self.page.dialog.open = True
        self.page.update()

    def build(self):
        self.tabs = ft.Tabs(
            selected_index=0,
            animation_duration=300,
            tabs=[
                ft.Tab(
                    text="敏感词库",
                    icon=ft.icons.SHIELD,
                    content=self._build_sensitive_word_panel()
                ),
                ft.Tab(
                    text="热词监控",
                    icon=ft.icons.HEARING,
                    content=self._build_monitor_word_panel()
                ),
                ft.Tab(
                    text="人员管理",
                    icon=ft.icons.PEOPLE_OUTLINE,
                    content=self._build_staff_panel()
                ),
                ft.Tab(
                    text="数据导入导出",
                    icon=ft.icons.IMPORT_EXPORT,
                    content=self._build_data_panel()
                ),
            ],
            expand=True
        )
        return self.tabs

    def _build_sensitive_word_panel(self):
        # Data Table for Sensitive Words
        table = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("Word")),
                ft.DataColumn(ft.Text("Risk Level")),
                ft.DataColumn(ft.Text("Trigger Action")),
                ft.DataColumn(ft.Text("Manage")),
            ],
            rows=[
                ft.DataRow(cells=[
                    ft.DataCell(ft.Text(item["word"])),
                    ft.DataCell(ft.Container(
                        content=ft.Text(item["level"], size=10),
                        bgcolor=ft.colors.RED_900 if item["level"]=="High" else ft.colors.ORANGE_900,
                        padding=5, border_radius=5
                    )),
                    ft.DataCell(ft.Text(item["action"])),
                    ft.DataCell(ft.Row([
                        ft.IconButton(ft.icons.EDIT, icon_size=16, icon_color=ft.colors.BLUE_400),
                        ft.IconButton(ft.icons.DELETE, icon_size=16, icon_color=ft.colors.RED_400),
                    ]))
                ]) for item in self.sensitive_words
            ],
            border=ft.border.all(1, ft.colors.WHITE10),
            border_radius=10,
        )
        
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Text("Interceptor Configuration", size=18, weight=ft.FontWeight.BOLD),
                    ft.Row([
                        ft.ElevatedButton("Add New Word", icon=ft.icons.ADD, bgcolor=ft.colors.BLUE_700, color=ft.colors.WHITE),
                        ft.ElevatedButton(
                            "Push Sync to All", 
                            icon=ft.icons.SYNC, 
                            bgcolor=ft.colors.ORANGE_700, 
                            color=ft.colors.WHITE,
                            on_click=self._trigger_global_sync
                        )
                    ], spacing=10)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(color=ft.colors.WHITE10),
                table
            ]),
            padding=20,
        )

    def _trigger_global_sync(self, e):
        # Access the commander through page session
        send_cmd = self.page.session.get("send_command")
        if send_cmd:
            # Target 'ALL' tells server to broadcast to the whole department
            send_cmd("ALL", {"type": "RELOAD_CONFIG"})
            self.page.snack_bar = ft.SnackBar(ft.Text("🚀 Sync Command Pushed to all agents!"), bgcolor=ft.colors.GREEN_700)
            self.page.snack_bar.open = True
            self.page.update()

    def _build_monitor_word_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Text("Passive Monitoring (Non-blocking)", size=18, weight=ft.FontWeight.BOLD),
                ft.Text("These words will be logged for trend analysis but won't trigger alerts.", size=12, color=ft.colors.GREY_400),
                ft.Divider(),
                ft.Wrap(
                    spacing=10,
                    run_spacing=10,
                    controls=[
                        ft.Chip(
                            label=ft.Text(f"{item['word']} ({item['count']})"),
                            leading=ft.Icon(ft.icons.LABEL_IMPORTANT_OUTLINE),
                            bgcolor=ft.colors.BLUE_GREY_900,
                            on_delete=lambda e: print("Deleted"),
                        ) for item in self.monitor_words
                    ]
                )
            ]),
            padding=20
        )

    def _build_staff_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Column([
                        ft.Text("员工账号与权限管理", size=18, weight=ft.FontWeight.BOLD),
                        ft.Text("管理访问角色、部门分配及账号状态", size=12, color=ft.colors.GREY_500),
                    ]),
                    ft.ElevatedButton("添加成员", icon=ft.icons.ADD, on_click=self._show_add_user_dialog),
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Divider(),
                ft.Row([
                    self.search_field,
                    self.filter_dept,
                    ft.IconButton(ft.icons.REFRESH, on_click=lambda e: self.refresh_data())
                ], spacing=10),
                ft.Container(height=10),
                self.staff_list
            ]),
            padding=20,
            expand=True
        )
    
    def _build_data_panel(self):
        return ft.Container(
            content=ft.Column([
                ft.Text("数据管理中心", size=18, weight=ft.FontWeight.BOLD),
                ft.Divider(),
                ft.Row([
                    self._build_action_card("导出日志", "下载完整审计日志 (CSV/Excel格式)", ft.icons.DOWNLOAD, ft.colors.GREEN),
                    self._build_action_card("备份数据库", "创建当前 SQL 数据库的完整快照", ft.icons.STORAGE, ft.colors.BLUE),
                    self._build_action_card("还原系统", "通过备份文件恢复系统数据", ft.icons.RESTORE, ft.colors.ORANGE),
                ], spacing=20)
            ]),
            padding=20
        )

    def _build_action_card(self, title, subtitle, icon, color):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, size=40, color=color),
                ft.Text(title, weight=ft.FontWeight.BOLD),
                ft.Text(subtitle, size=12, color=ft.colors.GREY_400, text_align=ft.TextAlign.CENTER),
                ft.ElevatedButton("立即执行", height=30)
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=10),
            padding=20,
            bgcolor=ft.colors.WHITE10,
            border_radius=10,
            width=200,
            height=200,
            alignment=ft.alignment.center
        )
