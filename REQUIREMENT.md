### **项目需求: FireAgentSpace**

#### 1\. 项目愿景

构建一个名为 `FireAgentSpace` 的多用户云开发平台。平台允许用户在隔离的 Docker 容器（`Environment`）中运行预设的 AI Agent 开发套件。平台需提供用户管理、环境生命周期控制、持久化数据存储（`Workspace`）、现代化UI，以及容器反向代理。

#### 2\. 核心技术框架

  * **后端:** Node.js (API 服务, Docker 交互, 反向代理)。
  * **前端:** React (管理仪表盘)。
  * **数据库:** 单一 JSON 文件 (存储元数据)。
  * **容器化:** Docker (后端编排)。

#### 3\. 关键实体与数据关系

1.  **User (用户):**

      * 角色: `Admin` (管理所有) / `User` (管理自己)。
      * ID: `UUID`。

2.  **Agent Suite (Agent 套件组):**

      * 身份: **环境模板 (Template)**。
      * 属性: `id (UUID)`, `name (string)`, `description (string)`, `initCommand (array/string)`。
      * 由 `Admin` 在后台定义。

3.  **Environment (环境):**

      * 身份: **核心资源实例**。
      * 属性: `id (UUID)`, `userId (UUID)`, `suiteId (UUID)`, `status (string)`, `hostPort (number)`, `workspacePath (string)`, `dockerContainerId (string)`。
      * `id`: 全局唯一，**用作所有 API 操作和反向代理的目标**。
      * `userId`: 标记此环境的拥有者。
      * `suiteId`: 标记此环境是基于哪个模板创建的。

4.  **核心业务逻辑 (不变):**

      * 一个用户可以为**每个** `Agent Suite` **最多创建一个** `Environment` 实例。
      * *示例: 后端在收到“创建”请求时，应检查 `(userId, suiteId)` 这对组合是否已存在于 `environments` 表中，如果存在则拒绝创建。*

#### 4\. 高级功能需求

**4.1. 管理员 (Admin) 功能:**

  * **用户管理:** CRUD `User` 账户。
  * **套件管理:** CRUD `Agent Suite` 模板。
  * **环境监控:** 查看所有 `Environment` 实例 (按 `id`, `userId`, `suiteId` 归类)。

**4.2. 普通用户 (User) 功能:**

  * **环境仪表盘:** \* 列表 1: 显示所有**可用**的 `Agent Suite` (模板)。
      * 列表 2: 显示用户**自己已创建**的 `Environment` 实例。
  * **环境创建 (Create):** 用户在 "可用套件" 列表中选择一个 `Suite`，后端 API 执行创建逻辑（检查 `(userId, suiteId)` 唯一性），成功后返回**新环境的 `id (UUID)`**。
  * **环境管理 (Manage):** 用户在 "我的环境" 列表中，针对**特定的 `environmentId`** 执行 "Start", "Stop", "Delete" 操作。
  * **WebUI 访问:** 用户点击某个已启动的环境，前端将其导航至该环境的专属代理 URL。

#### 5\. 核心技术架构

**5.1. Docker 架构:**

  * **基础镜像:** `fire-agentspace-basic:latest` (基于Ubuntu24.04 需要换源后安装Python3数据分析包(venv), Node.js LTS 依赖, 你需要编写这个dockerfile)。
  * **实例化:** 后端根据 `suiteId` 查找到对应的 `initCommand`，使用 `fire-agentspace-basic:latest` 镜像启动容器。
  * **持久化:** 每个 `Environment` 在创建时，都在宿主机上获得一个**基于其 `id (UUID)`** 的工作区目录（例如 `./data/workspaces/[environmentId]`），并将其挂载到容器内部。

**5.2. 数据与持久化 (JSON 数据库):**

  * **`db.json` 结构 (！仅展示例子 请根据实际优化):**
    ```json
    {
      "users": [
        { "id": "uuid-user-1", "username": "admin", "role": "admin", ... }
      ],
      "agentSuites": [
        { "id": "uuid-suite-1", "name": "Data Analysis Suite", "initCommand": "..." }
      ],
      "environments": [
        {
          "id": "uuid-env-1",
          "userId": "uuid-user-1",
          "suiteId": "uuid-suite-1",
          "dockerContainerId": "...",
          "status": "running",
          "hostPort": 30001,
          "workspacePath": "./data/workspaces/uuid-env-1"
        }
      ]
    }
    ```

**5.3. 内置反向代理 (Reverse Proxy)**

  * **目标:** 实现安全、统一、基于 UUID 的访问入口。
  * **实现:** 在 Node.js 后端中实现。
  * **路由:** `http://[platform_url]/proxy/[environmentId]/...`
  * **鉴权逻辑 (Authorization):**
    1.  后端中间件拦截所有 `/proxy/*` 的请求。
    2.  从请求中提取 `[environmentId]` (URL 参数) 和 `authToken` (Header/Cookie)。
    3.  **鉴权开始:**
        a.  验证 `authToken`，解析出 `userId`。
        b.  使用 `[environmentId]` 在 `db.json` 的 `environments` 表中查找记录。
        c.  **【核心检查】** 检查查找到的 `environment` 记录中的 `userId` 是否**严格等于** `authToken` 中的 `userId`。
        d.  如果**不等于**（或 `Admin` 角色例外），立即返回 403 Forbidden (禁止访问)。
    4.  **代理执行:**
        a.  如果鉴权通过，从 `environment` 记录中获取其 `hostPort` (例如 `30001`)。
        b.  将请求动态代理到 docker容器的地址(需要平台追踪并管理docker端口映射和Node.js的第二层反向代理)。

#### 6\. 杂项

**6.1. UI风格**
  * **目标:** 现代化，简洁易用
  * **配色:** #018eee为主色调，兼容深色/浅色模式
  * **视觉效果:** 仅保留必要动画效果