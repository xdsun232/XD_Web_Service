#!/usr/bin/env node

const AppointmentDatabase = require('./database');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

console.log('🔧 数据库管理工具');
console.log('');

const db = new AppointmentDatabase();

function showHelp() {
  console.log('使用方法:');
  console.log('  node db-utils.js <命令> [参数]');
  console.log('');
  console.log('可用命令:');
  console.log('  stats              显示数据库统计信息');
  console.log('  list-departments   列出所有科室');
  console.log('  list-appointments  列出所有预约记录');
  console.log('  clean-expired      清理过期预约记录');
  console.log('  add-dept <名称> <号源数>  添加新科室');
  console.log('  help               显示帮助信息');
}

function showStats() {
  console.log('📊 数据库统计信息:');
  console.log('');

  // 科室统计
  const departments = db.getAllDepartments();
  console.log(`🏥 科室数量: ${departments.length}`);

  // 预约统计
  const [tomorrow, dayAfterTomorrow] = db.getBookingWindow();
  console.log(`📅 预约窗口: ${tomorrow} - ${dayAfterTomorrow}`);

  let totalBooked = 0;
  let totalSlots = 0;

  departments.forEach(dept => {
    const bookedTomorrow = db.getBookedCount(dept.name, tomorrow);
    const bookedDayAfter = db.getBookedCount(dept.name, dayAfterTomorrow);
    const totalBookedDept = bookedTomorrow + bookedDayAfter;

    totalBooked += totalBookedDept;
    totalSlots += dept.max_slots * 2;

    console.log(`   ${dept.name}: ${totalBookedDept}/${dept.max_slots * 2} 个预约`);
  });

  console.log('');
  console.log(`📈 总预约情况: ${totalBooked}/${totalSlots} (${((totalBooked/totalSlots)*100).toFixed(1)}%)`);
}

function listDepartments() {
  console.log('🏥 科室列表:');
  console.log('');

  const departments = db.getAllDepartments();
  if (departments.length === 0) {
    console.log('   暂无科室');
    return;
  }

  departments.forEach((dept, index) => {
    console.log(`${index + 1}. ${dept.name} - 每日 ${dept.max_slots} 个号源`);
  });
}

function listAppointments() {
  console.log('📋 预约记录:');
  console.log('');

  // 这里需要添加一个获取所有预约的方法
  console.log('⚠️  此功能需要进一步实现');
}

function cleanExpired() {
  console.log('🧹 清理过期预约记录...');

  const deleted = db.cleanExpiredAppointments();
  console.log(`✅ 已清理 ${deleted} 条过期预约记录`);
}

function addDepartment(name, maxSlots) {
  if (!name || !maxSlots) {
    console.error('❌ 请提供科室名称和号源数量');
    console.log('用法: node db-utils.js add-dept <科室名称> <号源数>');
    return;
  }

  const slots = parseInt(maxSlots);
  if (isNaN(slots) || slots <= 0) {
    console.error('❌ 号源数量必须是正整数');
    return;
  }

  try {
    const stmt = db.db.prepare('INSERT INTO departments (name, max_slots) VALUES (?, ?)');
    const result = stmt.run(name, slots);

    if (result.changes > 0) {
      console.log(`✅ 成功添加科室: ${name} (${slots} 个号源/天)`);
    } else {
      console.log('⚠️  添加科室失败');
    }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('❌ 该科室已存在');
    } else {
      console.error('❌ 添加科室失败:', error.message);
    }
  }
}

// 主程序逻辑
switch (command) {
  case 'stats':
    showStats();
    break;

  case 'list-departments':
    listDepartments();
    break;

  case 'list-appointments':
    listAppointments();
    break;

  case 'clean-expired':
    cleanExpired();
    break;

  case 'add-dept':
    addDepartment(args[1], args[2]);
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    console.error('❌ 未知命令:', command);
    console.log('');
    showHelp();
    process.exit(1);
}

// 关闭数据库连接
process.on('exit', () => {
  db.close();
});