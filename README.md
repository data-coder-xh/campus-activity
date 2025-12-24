# 校园活动报名系统 说明文档

本项目为软件工程课程期末大作业，基于实际代码实现，目标是实现一个完整的校园活动报名Web平台。系统采用前后端分离架构，包含学生端活动浏览与报名功能，以及管理员端活动管理和报名审核功能。

## 技术栈

- **前端**：Vue 3 + Composition API + Vite + Vue Router + Axios
- **后端**：Node.js + Express + MySQL2 + JWT + bcrypt
- **数据库**：MySQL 8.0
- **开发工具**：VS Code + Git

---

## 一、项目简介

校园活动报名系统是一个功能完整的Web应用，用于统一管理校园内各类活动的报名流程。学生可以在前台浏览活动、查看详情并在线报名；管理员可以在后台发布活动、管理活动状态，并审核学生报名申请。

系统实现了完整的用户认证、权限控制、数据验证等企业级功能，代码结构清晰，适合作为软件工程课程项目展示。

---

## 二、主要功能

### 1. 学生端功能

- ✅ 用户注册登录（账号、密码、姓名、学号、学院、专业、电话）
- ✅ 活动列表浏览（支持状态筛选）
- ✅ 活动详情查看（时间、地点、报名人数等）
- ✅ 在线报名活动（资格验证、重复报名检查）
- ✅ 个人报名记录查看（审核状态管理）
- ✅ 用户信息管理（个人资料编辑）

### 2. 管理后台功能

- ✅ 管理员登录认证（JWT Token会话管理）
- ✅ 活动管理（创建、编辑、删除、上线/下线，支持限制学院/年级）
- ✅ 权限控制（管理员只能管理自己创建的活动）
- ✅ 报名审核管理（按活动查看报名列表）
- ✅ 审核状态更新（通过/拒绝报名申请）

---

## 三、项目结构

项目采用前后端分离的单仓库结构，代码组织清晰：

```
campus-activity/
│
├── README.md                     # 项目说明文档
├── package.json                  # 前端依赖配置
├── vite.config.js                # Vite构建配置
├── index.html                    # 前端入口 HTML
│
├── src/                          # 前端代码 (Vue 3)
│   ├── main.js                   # 应用入口
│   ├── App.vue                   # 根组件
│   ├── router/index.js           # 路由配置
│   ├── services/
│   │   ├── api.js                # API接口封装
│   │   └── auth.js               # 认证状态管理
│   │   └── toast.js              # 消息提示服务
│   ├── pages/                    # 页面组件 (9个页面)
│   │   ├── EventList.vue         # 活动列表页
│   │   ├── EventDetail.vue       # 活动详情页
│   │   ├── RegisterForm.vue      # 报名表单页
│   │   ├── MyRegistrations.vue   # 我的报名记录
│   │   ├── UserProfile.vue       # 用户信息页
│   │   ├── Login.vue             # 登录页
│   │   ├── Register.vue          # 注册页
│   │   ├── admin/
│   │   │   ├── AdminDashboard.vue     # 管理后台活动管理
│   │   │   ├── AdminRegistrations.vue # 报名审核页
│   │   │   └── AdminLogin.vue         # 管理员登录页（备用）
│   └── components/
│       ├── EventCard.vue         # 活动卡片组件
│       ├── Toast.vue             # 消息提示组件
│       └── ToastContainer.vue    # 消息容器
│
└── backend/                      # 后端代码 (Node.js)
    ├── app.js                    # 后端入口文件
    ├── package.json              # 后端依赖配置
    ├── middlewares/
    │   └── auth.js               # JWT认证中间件
    ├── controllers/              # 控制器层
    │   ├── authController.js     # 认证控制器
    │   ├── eventsController.js   # 活动控制器
    │   ├── usersController.js    # 用户控制器
    │   └── registrationsController.js # 报名控制器
    ├── models/                   # 数据模型层
    │   ├── db.js                 # 数据库连接
    │   ├── User.js               # 用户模型
    │   ├── Event.js              # 活动模型
    │   └── Registration.js       # 报名模型
    ├── routes/                   # 路由层
    │   ├── auth.js               # 认证路由
    │   ├── events.js             # 活动路由
    │   ├── users.js              # 用户路由
    │   └── registrations.js      # 报名路由
    └── database/
        └── schema.sql            # 数据库建表脚本
```

---

## 四、运行方式

### 1. 环境准备

确保安装了以下环境：
- Node.js >= 18.0.0
- MySQL >= 8.0
- npm 或 yarn

### 2. 启动后端服务

```bash
cd backend
npm install
```

创建 `.env` 文件并配置数据库：

```env
PORT=9000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_activity
DB_POOL_SIZE=10
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=campus-activity-secret
JWT_EXPIRES_IN=7d
```

启动MySQL服务并执行建表脚本：

```bash
# 连接MySQL并执行
source backend/database/schema.sql;
```

启动后端服务：

```bash
npm run start  # 或 npm run dev (开发模式)
```

后端将在 `http://localhost:9000` 运行。

### 3. 启动前端服务

```bash
cd ../  # 返回项目根目录
npm install
npm run dev
```

前端将在 `http://localhost:5173` 运行。

### 4. 可选的前端环境变量

前端默认请求 `http://localhost:9000/api`，如需修改可在根目录创建 `.env`：

```env
VITE_API_BASE_URL=http://localhost:9000/api
```

### 5. 访问系统

- **学生端**：http://localhost:5173
- **管理后台**：http://localhost:5173/admin/events
- **报名审核页**：http://localhost:5173/admin/registrations
- **默认管理员账号**：admin / admin123（见 `backend/database/schema.sql` 里的初始化数据）

---

## 五、数据库设计

系统采用MySQL数据库，包含三张核心表：

### 1. 用户表 (users)
```sql
- id: INT (主键)
- username: VARCHAR(50) (登录账号，唯一)
- password_hash: VARCHAR(255) (bcrypt加密密码)
- role: ENUM('student','admin') (用户角色)
- name: VARCHAR(50) (姓名)
- student_id: VARCHAR(32) (学号，唯一)
- phone: VARCHAR(20) (电话)
- college: VARCHAR(50) (学院)
- major: VARCHAR(50) (专业)
- create_time: TIMESTAMP (创建时间)
```

### 2. 活动表 (events)
```sql
- id: INT (主键)
- title: VARCHAR(100) (活动标题)
- cover: VARCHAR(255) (封面图片URL)
- description: TEXT (活动详情)
- start_time: DATETIME (开始时间)
- end_time: DATETIME (结束时间)
- place: VARCHAR(100) (活动地点)
- limit: INT (人数上限)
- status: TINYINT (0=下线,1=上线)
- creator_id: INT (创建者ID，外键)
- create_time: TIMESTAMP (发布时间)
```

### 3. 报名表 (registrations)
```sql
- id: INT (主键)
- user_id: INT (用户ID，外键)
- event_id: INT (活动ID，外键)
- remark: VARCHAR(255) (报名备注)
- status: TINYINT (0=待审核,1=通过,2=拒绝)
- create_time: TIMESTAMP (报名时间)
```

**数据关系**：
- 用户 1:N 报名记录
- 活动 1:N 报名记录
- 活动 N:1 用户（创建者关系）

---

## 六、技术实现特点

### 前端技术栈
- **Vue 3 Composition API**：现代化的响应式数据管理
- **Vite**：快速的构建工具，支持热更新
- **Vue Router**：单页应用路由管理，支持权限守卫
- **Axios**：HTTP客户端，支持请求/响应拦截器
- **自定义状态管理**：使用Vue的reactive/ref进行状态管理

### 后端技术栈
- **Express.js**：轻量级Web框架
- **MySQL2**：数据库驱动，支持连接池
- **JWT**：JSON Web Token进行身份认证
- **bcrypt**：密码哈希加密
- **CORS**：跨域资源共享配置
- **Morgan**：HTTP请求日志记录

### 核心功能实现
- **身份认证**：JWT Token + 密码哈希
- **权限控制**：路由守卫 + 中间件验证
- **数据验证**：前后端双重校验
- **错误处理**：统一错误响应格式
- **安全防护**：SQL注入防护、XSS防护

---

## 七、API接口文档

统一前缀：`/api`，所有需要登录的接口都要求 `Authorization: Bearer <token>`。

### 健康检查
- `GET /health` - 服务健康状态

### 认证接口 (`/api/auth`)
- `POST /register` - 用户注册
- `POST /login` - 用户登录

### 用户接口 (`/api/users`)
- `GET /me` - 获取当前用户信息
- `PUT /me` - 更新当前用户信息

### 活动接口 (`/api/events`)
- `GET /` - 获取活动列表（支持状态筛选）
- `GET /:id` - 获取活动详情
- `POST /` - 创建活动（管理员）
- `PUT /:id` - 更新活动（管理员）
- `PATCH /:id/status` - 更新活动状态（管理员）
- `DELETE /:id` - 删除活动（管理员）

### 报名接口 (`/api/registrations`)
- `GET /` - 获取我的报名记录
- `POST /` - 提交报名申请
- `PATCH /:id/status` - 更新报名状态（管理员）

---

## 八、测试说明

后端提供了基于 Jest + Supertest 的接口测试用例（6个用例），并包含测试环境数据清理接口：

```bash
cd backend
npm run test
```

说明：
- 测试环境下启用 `DELETE /api/test/cleanup` 清理测试数据
- `npm run test:watch` 可用于本地调试

---

## 九、常见问题

1. **后端报 CORS 错误**  
   检查 `CORS_ORIGINS` 是否包含前端地址（可用逗号分隔多个域名）。

2. **无法登录管理员**  
   请确认已执行 `backend/database/schema.sql`，并使用 `admin / admin123` 登录。

3. **数据库连接失败**  
   确认 `.env` 中的数据库账号、密码和库名与本地 MySQL 一致。
