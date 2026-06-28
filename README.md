# STEMHUB CONRAD CHALLENGE SYS. (CONRAD_SYS_2026)

康莱德队伍学习日志与创新简报管理系统 — Conrad Team Learning Log & Innovation Brief System。

## 技术栈

- **Backend:** Django 5 + DRF + JWT + SQLite
- **Frontend:** Next.js 14 + TypeScript + Tailwind

## 本地开发

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 可选，开发默认即可
python manage.py migrate
python manage.py seed_demo   # 可选：填充演示数据
python manage.py runserver
```

### 前端

```bash
cd frontend
npm install
cp .env.production.example .env.local   # 开发用 localhost
npm run dev
```

- 前端：http://localhost:3000
- API：http://localhost:8000/api/

## 生产部署（阿里云 ECS）

服务器公网 IP：`39.102.56.62`

```bash
# SSH 登录服务器后执行：
curl -fsSL https://raw.githubusercontent.com/JJZHANG0/CONRAD_SYS_2026/main/deploy/deploy.sh | bash
```

或手动：

```bash
git clone https://github.com/JJZHANG0/CONRAD_SYS_2026.git /opt/conrad_sys
cd /opt/conrad_sys
bash deploy/deploy.sh
```

部署完成后访问：**http://39.102.56.62**

### 首次上线后

```bash
cd /opt/conrad_sys/backend
source venv/bin/activate
python manage.py createsuperuser   # 创建管理员账号
# 如需演示数据：python manage.py seed_demo
```

## 页面路由

| 路径 | 说明 |
|------|------|
| /login | 登录 |
| /dashboard | 首页 |
| /my-logs | 学生日志 |
| /teams/[id] | 队伍详情 |
| /teams/[id]/students/[sid]/logs | 老师评语 |
| /teams/[id]/innovation-brief | Innovation Brief |

## 仓库

GitHub: https://github.com/JJZHANG0/CONRAD_SYS_2026
