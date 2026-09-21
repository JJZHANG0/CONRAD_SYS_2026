# Conrad Team Command Center
## 康莱德队伍管理中心

面向康莱德创新挑战赛项目运营的内部管理平台。

## 技术栈

### 前端
- Next.js 14 + TypeScript
- Tailwind CSS
- Framer Motion / Recharts
- React Hook Form + Zod

### 后端
- Django 4.2 + Django REST Framework
- JWT 认证 (Simple JWT)
- SQLite (开发) / PostgreSQL (生产)
- drf-spectacular API 文档

## 快速开始

### 1. 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data    # 导入演示数据
python manage.py runserver
```

后端运行在 http://localhost:8000
API 文档: http://localhost:8000/api/docs/

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000

### 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 系统管理员 |
| pm_wang | pm123 | 项目经理 |
| academic_chen | ac123 | 教务老师 |
| mentor_liu | m123 | 导师 |

## 页面清单

1. 登录页 `/login`
2. 总览 Dashboard `/dashboard`
3. 队伍管理 `/teams`
4. 队伍详情 `/teams/[id]`
5. 阶段交付物 `/deliverables`
6. 课堂记录 `/lessons`
7. 导师评分 `/teacher-evaluation`
8. 队伍评分 `/team-scoring`
9. 风险看板 `/risks`
10. 课程日历 `/calendar`
11. 模板库 `/templates`
12. 导师排行 `/teacher-ranking`
13. 数据分析 `/analytics`
14. 系统设置 `/settings`

## API 端点

| 模块 | 路径 |
|------|------|
| 认证 | `/api/auth/login/`, `/api/auth/me/` |
| 队伍 | `/api/teams/` |
| 交付物 | `/api/deliverables/` |
| 课堂 | `/api/lessons/` |
| 评分 | `/api/evaluations/teacher/`, `/api/evaluations/team/` |
| 风险 | `/api/risks/` |
| 模板 | `/api/templates/` |
| 分析 | `/api/analytics/dashboard/` |

## 项目结构

```
CONRAD_CHALLENGE_SYSTEM/
├── backend/
│   ├── config/          # Django 配置
│   ├── accounts/        # 用户与认证
│   ├── teams/           # 队伍、学生、阶段
│   ├── deliverables/    # 交付物
│   ├── lessons/         # 课堂记录与日历
│   ├── evaluations/     # 导师/队伍评分
│   ├── risks/           # 风险管理
│   ├── templates_lib/   # 模板库
│   └── analytics/       # 数据分析
└── frontend/
    └── src/
        ├── app/           # 14 个页面
        ├── components/    # UI 组件与布局
        └── lib/           # API、类型、工具
```
