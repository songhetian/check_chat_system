---
name: api-modular-guard
description: 强制执行 API 接口模块化与目录规范。当创建或更新 FastAPI/Python API 接口时使用。确保所有接口根据业务逻辑拆分到 api/ 目录下的不同文件中，且模型引用遵循重构后的 core.models 规范。
---

# Api Modular Guard

## 核心原则

为了保持代码的可读性和可维护性，所有代码必须遵循分层架构和模块化拆分规范。

### 1. Skill 自我进化红线 (强制)
*   **主动补全**：若在开发中发现 API 规范描述不全、缺失环境依赖声明（如缺失 fastapi 导致 ModuleNotFoundError）或数据库优化策略有误，**必须立即主动修改并重新打包该 Skill**。
*   **环境自愈红线 (强制)**：每当遇到依赖缺失错误，必须强制使用项目虚拟环境执行修复：`./venv/bin/pip install <package>`。严禁使用全局 pip。
*   **依赖同步红线 (物理强制)**：**每当通过 pip 安装新包后，必须立即将其名称与版本号手动补全至根目录下的 `requirements.txt` 中**。确保物理环境定义与代码库同步，严禁出现“本地能跑，服务器缺失依赖”的故障。
*   **知识沉淀**：每一次针对环境修复或 SQL 兼容性的处理，必须固化为新的审计条目。

### 2. 目录结构规范
*   **`api/`**：存放所有 API 路由逻辑（如 `admin.py`, `auth.py`）。
*   **`core/`**：存放核心业务逻辑（`services.py`）和数据库模型（`models.py`）。
*   **`database/`**：存放 SQL 脚本和数据库初始化文件。
*   **`logs/`**：存放所有运行日志，禁止在根目录堆积 `.log` 文件。
*   **`utils/`**：存放守卫进程、初始化脚本等辅助工具。

### 2. 业务逻辑隔离
*   **禁止堆积**：严禁在 `engine.py` 或单一文件中定义所有接口。
*   **导入规范**：所有 API 模块必须使用分层导入，例如：`from core.models import User`。

### 3. 数据库与缓存协同审计 (强制)
*   **每动必查**：在**任何**新增或修改功能时，必须同步检查 MySQL 和 Redis 的代码是否需要优化。
*   **MySQL 优化红线**：
    *   **全站数据隔离红线 (强制检查)**：针对每个页面/接口，必须实现严格的数据隔离。
        *   **逻辑控制**：后端必须校验请求者的 `role`。
        *   **普通主管 (ADMIN)**：查询语句必须强制绑定 `dept_id` 过滤条件，严禁跨部门越权查看。
        *   **总部管理员 (HQ)**：默认可见全域数据，支持多维搜索。
    *   **逻辑删除过滤**：除非是特殊的恢复/审计接口，否则所有业务查询必须强制包含 `is_deleted=0` 条件，严禁展示已删除数据。
    *   检查查询字段是否命中索引。
    *   高频查询必须避免 `SELECT *`，仅取 `values()`。
    *   复杂计算尽可能移至应用层或使用 Redis 预计算。
*   **Redis 优化红线**：
    *   高频读取的“瞬态”数据（如实时对话、心跳）禁止持久化到 MySQL，必须使用 Redis 存储。
    *   检查 Key 的命名规范和 TTL 过期策略。
    *   禁止在生产环境使用 `KEYS`，统一使用 `SCAN` 或 `Sets/Hashes`。

### 4. 路由管理
*   使用 FastAPI 的 `APIRouter` 进行路由定义。
*   在 `engine.py` 中通过 `app.include_router()` 统一注册。

## 操作指南

### 场景 A：新增接口
1.  **分析业务**：识别新接口所属的业务领域。
2.  **查找现有文件**：检查 `api/` 目录下是否已有相关的业务文件。
    *   如果有，则追加接口。
    *   如果没有，则新建 `.py` 文件，初始化 `APIRouter`。
3.  **引用模型**：确保从 `core.models` 导入所需模型。
4.  **验证与测试 (强制)**：
    *   **连通性测试**：接口完成后，必须通过 `run_shell_command` 启动服务（或在测试环境下），使用 `curl` 或 `httpx` 进行调用。
    *   **自愈循环**：如果测试返回非 200 状态码或抛出异常，必须分析 `logs/engine.log` 中的 Traceback，定位并修复错误，直至测试通过。
5.  **性能优化 (最高效方式)**：
    *   **减少查询**：必须使用 `.select_related()` 处理外键，或使用 `.prefetch_related()` 处理反向关联，严禁出现 N+1 查询。
    *   **按需取字段**：在列表接口中，使用 `.values()` 只提取前端需要的字段，减少内存占用和序列化开销。
    *   **异步并发**：如果有多个不相关的 IO 操作（如同时查 Redis 和 DB），应使用 `asyncio.gather()` 并发执行。
6.  **注册路由**：如果新建了文件，确保在 `engine.py` 中导入并注册。

### 场景 B：新增/修改业务逻辑
1.  **逻辑位置**：通用的业务处理（如复杂事务、扫描逻辑）应放在 `core/services.py` 中。
2.  **API 调用**：API 路由层只负责解析请求和返回响应，具体的业务动作应调用 `services.py` 中的函数。

## 示例

**好的做法 (core/models.py):**
```python
class User(BaseModel): ...
```

**好的做法 (api/admin.py):**
```python
from core.models import User
router = APIRouter(prefix="/api/admin", tags=["Admin"])
@router.get("/agents")
async def get_agents(): ...
```

**好的做法 (engine.py):**
```python
from api.admin import router as admin_router
app.include_router(admin_router)
```
