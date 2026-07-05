# 批量导入账号与队伍 — 填写指南

## 模板文件

`docs/bulk_import_template.xlsx`

重新生成模板：

```bash
pip install openpyxl
python scripts/generate_import_template.py
```

## 工作表说明

| 工作表 | 用途 |
|--------|------|
| 填写说明 | 字段规则与注意事项 |
| 老师 Teachers | 创建老师登录账号 |
| 学生 Students | 创建学生登录账号 |
| 队伍 Teams | 创建队伍并绑定带队老师 |
| 队伍成员 Team Members | 将学生加入对应队伍 |

## 必填字段

### 老师 Teachers

| 列名 | 说明 |
|------|------|
| username* | 登录用户名，唯一 |
| password* | 初始密码 |
| display_name* | 显示名称（中文名） |
| email* | 邮箱，唯一 |
| school | 学校（可选） |

### 学生 Students

| 列名 | 说明 |
|------|------|
| username* | 登录用户名，唯一 |
| password* | 初始密码 |
| display_name* | 显示名称（中文名） |
| email* | 邮箱，唯一 |
| school | 学校（可选） |
| grade | 年级，如 G10（可选） |

### 队伍 Teams

| 列名 | 说明 |
|------|------|
| team_name* | 队伍名称，唯一 |
| project_name* | 项目名称 |
| challenge_category* | 挑战类别 |
| teacher_username* | 带队老师的 username（须已在「老师」表中） |
| description | 队伍简介（可选） |

### 队伍成员 Team Members

| 列名 | 说明 |
|------|------|
| team_name* | 队伍名称（须已在「队伍」表中） |
| student_username* | 学生 username（须已在「学生」表中） |
| student_role | 队内角色，如 CEO / CTO（可选） |

## 业务规则

1. **每支队伍最多 5 名学生**
2. **每名学生只能加入 1 支队伍**
3. **username 和 email 在全系统内不能重复**
4. 填写顺序：**老师 → 学生 → 队伍 → 队伍成员**
5. 示例行（灰色背景）可删除，仅作参考

## 提交前检查清单

- [ ] 所有带 * 的列已填写
- [ ] username / email 无重复
- [ ] teacher_username 均能在「老师」表中找到
- [ ] team_name 在「队伍成员」表中均能在「队伍」表中找到
- [ ] student_username 在「队伍成员」表中均能在「学生」表中找到
- [ ] 每支队伍成员 ≤ 5 人
- [ ] 密码已统一或按规范设置

## 导入方式（后续）

填好 Excel 后，可使用 Django 管理命令导入（待部署）：

```bash
python manage.py import_bulk_data docs/your_filled_data.xlsx
```

或先在 Django Admin（http://服务器/admin/）手动创建，批量导入脚本上线后再切换。
