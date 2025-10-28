# 数据库升级说明

## 🎯 升级概述

本次升级将就诊预约系统从内存存储升级为数据库持久化存储，解决了服务重启数据丢失的问题。

## 📊 技术选型

- **数据库**: better-sqlite3
  - 轻量级，无需额外服务
  - 性能优秀，支持同步操作
  - 安装简单，编译稳定
  - 文件存储，易于备份

## 🏗️ 数据库设计

### 1. 科室表 (departments)
```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  max_slots INTEGER NOT NULL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. 预约表 (appointments)
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  department_name TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(phone, appointment_date),
  FOREIGN KEY (department_name) REFERENCES departments(name)
)
```

## 🚀 新增功能

### 1. 数据库管理命令

```bash
# 初始化数据库
npm run init-db

# 查看数据库统计
npm run db-stats

# 清理过期预约
npm run db-clean

# 查看科室列表
npm run db-departments
```

### 2. 数据库管理工具

详细使用方法：
```bash
# 查看帮助
node db-utils.js help

# 显示统计信息
node db-utils.js stats

# 添加新科室
node db-utils.js add-dept "儿科" 15

# 列出所有预约记录
node db-utils.js list-appointments

# 清理过期数据
node db-utils.js clean-expired
```

## 📋 升级前后对比

| 特性 | 升级前 | 升级后 |
|------|--------|--------|
| 数据存储 | 内存存储 | SQLite数据库 |
| 数据持久化 | ❌ 服务重启丢失 | ✅ 永久保存 |
| 数据管理 | 无专用工具 | 完整管理工具 |
| 数据备份 | 无法备份 | 复制.db文件即可 |
| 并发安全 | 基础保护 | 数据库事务保证 |
| 扩展性 | 受限 | 支持复杂查询 |

## 🔄 升级步骤

### 1. 环境准备
```bash
cd server
npm install better-sqlite3
```

### 2. 初始化数据库
```bash
npm run init-db
```

### 3. 启动服务
```bash
npm start
```

## 📁 新增文件

- `server/database.js` - 数据库操作类
- `server/init-db.js` - 数据库初始化脚本
- `server/db-utils.js` - 数据库管理工具
- `server/appointments.db` - SQLite数据库文件（自动生成）

## 🔧 代码变更

### 主要重构
- `server/index.js` - 完全重构，移除内存存储，使用数据库操作
- `server/package.json` - 添加数据库相关脚本

### API改进
- 所有API接口现在支持数据库持久化
- 添加了更完善的错误处理
- 支持优雅关闭，确保数据安全

## 🧪 测试验证

升级后已通过以下测试：

1. ✅ 数据库初始化成功
2. ✅ 服务器启动正常
3. ✅ 查询号源API正常
4. ✅ 预约功能正常（返回数据库ID）
5. ✅ 取消预约功能正常
6. ✅ 数据一致性维护正常
7. ✅ 数据库管理工具正常

## 💡 使用建议

### 日常运维
1. 定期清理过期预约：`npm run db-clean`
2. 监控数据库大小：检查`appointments.db`文件大小
3. 定期备份数据库：复制`appointments.db`文件

### 数据备份
```bash
# 备份数据库
cp server/appointments.db server/backup/appointments.$(date +%Y%m%d_%H%M%S).db

# 恢复数据库
cp server/backup/appointments.20251028_150000.db server/appointments.db
```

## 🚨 注意事项

1. **数据文件位置**: `server/appointments.db`
2. **文件权限**: 确保服务器进程对.db文件有读写权限
3. **备份重要性**: 建议定期备份数据库文件
4. **并发访问**: better-sqlite3支持并发读取，写入操作会自动排队

## 🔮 未来扩展

基于数据库的架构，未来可以轻松添加：

1. **用户系统** - 用户注册、登录、权限管理
2. **预约历史** - 完整的预约记录查询
3. **统计分析** - 各种预约统计报表
4. **医生管理** - 按医生分配预约时间
5. **时间段管理** - 支持更细粒度的时间预约
6. **通知系统** - 预约提醒、取消通知

## 📈 性能优势

- **查询性能**: SQLite索引优化，查询速度快
- **并发支持**: 支持多用户同时操作
- **事务支持**: 确保数据一致性
- **存储效率**: 压缩存储，占用空间小
- **启动速度**: 无需复杂初始化，启动迅速