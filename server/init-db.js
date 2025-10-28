#!/usr/bin/env node

const AppointmentDatabase = require('./database');
const path = require('path');
const fs = require('fs');

console.log('🗄️  开始初始化数据库...');

try {
  // 检查是否已存在数据库文件
  const dbPath = path.join(__dirname, 'appointments.db');

  if (fs.existsSync(dbPath)) {
    console.log('⚠️  数据库文件已存在，将进行备份...');
    const backupPath = path.join(__dirname, `appointments.backup.${Date.now()}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ 数据库已备份至: ${backupPath}`);

    // 删除旧数据库
    fs.unlinkSync(dbPath);
    console.log('🗑️  已删除旧数据库文件');
  }

  // 创建新的数据库实例
  console.log('🏗️  正在创建新的数据库...');
  const db = new AppointmentDatabase();

  // 验证科室数据
  console.log('🏥 验证科室数据...');
  const departments = db.getAllDepartments();
  console.log(`✅ 已创建 ${departments.length} 个科室:`);
  departments.forEach(dept => {
    console.log(`   - ${dept.name}: ${dept.max_slots} 个号源/天`);
  });

  // 验证预约窗口
  const [tomorrow, dayAfterTomorrow] = db.getBookingWindow();
  console.log(`📅 预约窗口: ${tomorrow} 和 ${dayAfterTomorrow}`);

  // 检查数据库文件
  const stats = fs.statSync(dbPath);
  console.log(`📊 数据库文件大小: ${(stats.size / 1024).toFixed(2)} KB`);

  // 关闭数据库连接
  db.close();

  console.log('🎉 数据库初始化完成！');
  console.log('');
  console.log('📋 下一步操作:');
  console.log('   1. 启动服务器: npm start');
  console.log('   2. 打开客户端: client/index.html');
  console.log('   3. 开始测试预约功能');
  console.log('');
  console.log('💡 提示: 数据将持久化保存在 appointments.db 文件中');

} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}