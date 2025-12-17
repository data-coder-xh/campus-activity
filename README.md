````md
# 校园活动报名系统

本项目为软件工程课程期末大作业，目标是实现一个面向校园学生与活动组织者的 Web 端活动报名系统。系统采用前后端分离架构，包括学生端活动浏览与报名功能，以及管理员端活动管理与报名审核功能。

技术栈：

- 前端：Vue 3 + Vite + JavaScript
- 后端：Node.js + Express（JavaScript）
- 数据库：MySQL（或其他关系型数据库）

---

## 一、项目简介

校园活动报名系统用于统一管理校园内各类活动的报名流程。学生可以在前台浏览活动列表、查看详情并在线报名；管理员可以在后台发布活动、编辑活动信息，查看并审核报名记录。

项目结构清晰，适合作为课程项目展示与后续扩展。

---

## 二、主要功能

### 1. 学生端（前台）

- 账号密码登录 / 注册
- 活动列表浏览
- 活动详情查看
- 在线报名活动
- 查看个人报名记录
- 编辑个人基本信息（如姓名、学号、联系方式等）

### 2. 活动发布者端

- 活动发布者登录
- 创建活动、编辑活动、删除/下线活动
- 查看自己创建的活动列表及其审核状态
- 查看某个活动的报名列表
- 审核学生报名（通过 / 拒绝）

### 3. 审核管理员端

- 审核管理员登录
- 审核活动发布者提交的活动（通过 / 拒绝）
- 查看待审核、已通过、已拒绝的活动列表

---

## 三、项目结构

项目采用单仓库（monorepo）形式，前后端代码在同一项目中，`src` 与 `backend` 同级。

```bash
campus-activity/
│
├── README.md
├── package.json          # 顶层只用作说明或统一脚本（可选）
├── vite.config.js        # 前端构建配置
│
├── src/                  # 前端代码（Vue 3 + JS）
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │     └── index.js
│   ├── pages/
│   │     ├── EventList.vue          # 活动列表页
│   │     ├── EventDetail.vue        # 活动详情页
│   │     ├── RegisterForm.vue       # 报名表单页
│   │     ├── MyRegistrations.vue    # 我的报名记录
│   │     └── UserProfile.vue        # 用户信息页
│   ├── components/
│   │     └── EventCard.vue
│   ├── services/
│   │     └── api.js                 # 封装接口请求
│   └── assets/
│
└── backend/             # 后端代码（Node.js + Express）
    ├── package.json
    ├── app.js           # 入口文件
    ├── routes/
    │     ├── events.js
    │     ├── users.js
    │     └── registrations.js
    ├── controllers/
    │     ├── eventsController.js
    │     ├── usersController.js
    │     └── registrationsController.js
    ├── models/
    │     ├── db.js               # 数据库连接
    │     ├── Event.js
    │     ├── User.js
    │     └── Registration.js
    └── database/
          └── schema.sql          # 数据库建表 SQL
````

> 说明：如果你希望前后端分别安装依赖，可在 `src` 和 `backend` 各自维护独立的 `package.json`。

---

## 四、运行方式

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd campus-activity
```

---

### 2. 启动后端（Node.js + Express）

进入 backend 目录：

```bash
cd backend
npm install
```

配置数据库（在 `backend/models/db.js` 中修改 MySQL 连接信息），然后执行建表 SQL：

```bash
# 在数据库客户端中执行
source backend/database/schema.sql;
```

启动后端服务：

```bash
npm run start
# 或
node app.js
```

默认后端运行在：

```text
http://localhost:9000
```

#### 环境变量

在 `backend` 目录下创建 `.env` 文件，示例内容如下：

```
PORT=9000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=campus_activity
CORS_ORIGINS=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=campus-activity-secret
JWT_EXPIRES_IN=7d
```

> 注意：WampServer 的 MySQL 默认密码为空，`DB_PASSWORD` 应留空。

---

### 3. 执行数据库建表 SQL

在 phpMyAdmin 或 MySQL 客户端中执行 `backend/database/schema.sql` 文件，创建数据库表并插入默认数据。

---

### 4. 默认账号信息

系统预设了以下三个默认账号，**所有账号的密码都是 `admin123`**：

| 账号 | 密码 | 角色 | 说明 |
|------|------|------|------|
| `reviewer` | `admin123` | 审核管理员 | 负责审核活动发布者提交的活动 |
| `organizer01` | `admin123` | 活动发布者 | 可以创建和管理自己发布的活动 |
| `student01` | `admin123` | 学生 | 可以浏览和报名活动 |

**登录后跳转页面**：
- `reviewer` → 活动审核页面（`/admin/review`）
- `organizer01` → 我的活动页面（`/admin/events`）
- `student01` → 活动列表页面（`/`）

---

### 5. 启动前端（Vue 3 + Vite + JS）

回到项目根目录：

```bash
cd ../
npm install
```

运行开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

前端会通过类似 `http://localhost:9000/api/...` 调用后端接口（具体参见 `src/services/api.js` 中的配置）。

---

## 五、数据库设计概述

系统主要包括三张核心表：

### 1. 用户表（users）

* 存储学生用户基本信息（姓名、学号、学院、电话等）
* 与报名记录表通过 `user_id` 关联

### 2. 活动表（events）

* 存储活动标题、时间、地点、详情、人数上限、状态等信息
* 包含 `creator_id` 字段，记录活动创建者（管理员）
* 与报名记录表通过 `event_id` 关联
* 与用户表通过 `creator_id` 关联（外键约束）

### 3. 报名表（registrations）

* 关联用户与活动
* 存储报名时间、备注、审核状态（待审核/通过/拒绝）

具体字段与建表语句见：

```text
backend/database/schema.sql
```

---

## 六、技术栈说明

### 前端

* Vue 3（Composition API 或 Options API，使用 JavaScript）
* Vite（构建工具）
* Vue Router（路由管理）
* Axios（HTTP 请求库）
* 简单状态管理（可使用 `reactive` / `ref` 或自行封装 store）

### 后端

* Node.js
* Express
* MySQL / mysql2
* 可选：JWT 用于管理员登录状态管理

---

## 七、功能模块说明（简要）

### 学生端

* **活动列表页**：请求活动列表接口，展示活动卡片，点击进入详情
* **活动详情页**：展示活动详细信息，提供报名入口
* **报名表单**：提交姓名、学号、联系方式等信息
* **我的报名**：查询当前用户所有报名记录及审核状态
* **个人信息**：展示与修改用户基本资料（可选）

### 活动发布者端

* **活动发布者登录**：账号密码登录，登录成功后访问活动管理页面
* **活动管理**：创建/编辑/删除/上下线活动（**注意：活动发布者只能管理自己创建的活动**）
* **报名管理**：按活动查看报名列表，修改报名状态（通过/拒绝）
* **审核状态**：查看活动的审核状态（待审核/已通过/已拒绝），只有审核通过的活动才能上线

### 审核管理员端

* **审核管理员登录**：账号密码登录，登录成功后访问活动审核页面
* **活动审核**：审核活动发布者提交的活动（通过/拒绝）
* **审核列表**：查看待审核、已通过、已拒绝的活动列表

---

## 八、说明

本项目主要用于软件工程课程设计与前后端开发实践，代码与设计均可根据课程要求与实际情况进行适当简化或扩展。
