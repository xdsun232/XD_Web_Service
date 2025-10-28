const Database = require('better-sqlite3');
const path = require('path');

class AppointmentDatabase {
  constructor() {
    this.db = new Database(path.join(__dirname, 'appointments.db'), { verbose: console.log });
    this.initDatabase();
  }

  initDatabase() {
    // 创建科室表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        max_slots INTEGER NOT NULL DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建预约表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        department_name TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phone, appointment_date),
        FOREIGN KEY (department_name) REFERENCES departments(name)
      )
    `);

    // 初始化科室数据
    this.initDepartments();
  }

  initDepartments() {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO departments (name, max_slots) VALUES (?, ?)');

    const departments = [
      { name: '内科', maxSlots: 10 },
      { name: '外科', maxSlots: 10 }
    ];

    departments.forEach(dept => {
      stmt.run(dept.name, dept.maxSlots);
    });
  }

  // 预约相关方法
  bookAppointment(phone, departmentName, date) {
    const stmt = this.db.prepare(`
      INSERT INTO appointments (phone, department_name, appointment_date)
      VALUES (?, ?, ?)
    `);

    try {
      const result = stmt.run(phone, departmentName, date);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('该手机号已预约');
      }
      throw error;
    }
  }

  cancelAppointment(phone) {
    const stmt = this.db.prepare('DELETE FROM appointments WHERE phone = ?');
    const result = stmt.run(phone);
    return result.changes > 0;
  }

  getAppointmentByPhone(phone) {
    const stmt = this.db.prepare(`
      SELECT a.*, d.max_slots
      FROM appointments a
      JOIN departments d ON a.department_name = d.name
      WHERE a.phone = ?
    `);
    return stmt.get(phone);
  }

  // 获取科室信息
  getDepartment(name) {
    const stmt = this.db.prepare('SELECT * FROM departments WHERE name = ?');
    return stmt.get(name);
  }

  getAllDepartments() {
    const stmt = this.db.prepare('SELECT * FROM departments');
    return stmt.all();
  }

  // 获取号源可用性
  getAvailability() {
    const [tomorrow, dayAfterTomorrow] = this.getBookingWindow();
    const availability = {};

    // 获取所有科室
    const departments = this.getAllDepartments();

    departments.forEach(dept => {
      availability[dept.name] = [];

      // 为每个科室获取明后两天的预约情况
      [tomorrow, dayAfterTomorrow].forEach(date => {
        const bookedCount = this.getBookedCount(dept.name, date);

        availability[dept.name].push({
          date: date,
          available: Math.max(dept.max_slots - bookedCount, 0),
          booked: bookedCount
        });
      });
    });

    return availability;
  }

  // 获取特定日期的预约数量
  getBookedCount(departmentName, date) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE department_name = ? AND appointment_date = ?
    `);
    const result = stmt.get(departmentName, date);
    return result.count;
  }

  // 清理过期预约数据
  cleanExpiredAppointments() {
    const [tomorrow, dayAfterTomorrow] = this.getBookingWindow();
    const stmt = this.db.prepare(`
      DELETE FROM appointments
      WHERE appointment_date NOT IN (?, ?)
    `);
    const result = stmt.run(tomorrow, dayAfterTomorrow);
    return result.changes;
  }

  // 获取预约窗口（明天和后天）
  getBookingWindow() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    return [
      this.formatDate(tomorrow),
      this.formatDate(dayAfterTomorrow)
    ];
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 关闭数据库连接
  close() {
    this.db.close();
  }
}

module.exports = AppointmentDatabase;