const express = require("express");
const cors = require("cors");
const AppointmentDatabase = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 初始化数据库
const db = new AppointmentDatabase();

// 验证工具函数
function isValidBookingDate(date) {
  const [tomorrow, dayAfterTomorrow] = db.getBookingWindow();
  return date >= tomorrow && date <= dayAfterTomorrow;
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

app.post("/api/appointment/book", (req, res) => {
  const { date, department, phone } = req.body || {};

  // 参数验证
  if (!date || !department || !phone) {
    return res.status(400).json({ success: false, message: "缺少必要参数" });
  }

  if (!isValidBookingDate(date)) {
    return res
      .status(400)
      .json({ success: false, message: "不在预订日期内" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "无效手机号" });
  }

  // 验证科室是否存在
  const departmentInfo = db.getDepartment(department);
  if (!departmentInfo) {
    return res.status(400).json({ success: false, message: "无效科室" });
  }

  // 检查号源是否已满
  const bookedCount = db.getBookedCount(department, date);
  if (bookedCount >= departmentInfo.max_slots) {
    return res.status(400).json({ success: false, message: "暂无预约号" });
  }

  try {
    // 尝试预约
    const result = db.bookAppointment(phone, department, date);

    return res.json({
      success: true,
      message: "预约成功",
      data: { department, date, phone, id: result.id },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "预约失败"
    });
  }
});

app.post("/api/appointment/cancel", (req, res) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res.status(400).json({ success: false, message: "缺少手机号" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "无效手机号" });
  }

  // 检查预约是否存在
  const appointment = db.getAppointmentByPhone(phone);
  if (!appointment) {
    return res.status(404).json({ success: false, message: "该手机号无预约" });
  }

  // 取消预约
  const success = db.cancelAppointment(phone);
  if (success) {
    return res.json({
      success: true,
      message: "取消预约成功",
      data: {
        department: appointment.department_name,
        date: appointment.appointment_date,
        phone: phone
      }
    });
  } else {
    return res.status(500).json({ success: false, message: "取消预约失败" });
  }
});

app.get("/api/appointment/availability", (req, res) => {
  try {
    // 清理过期预约数据
    db.cleanExpiredAppointments();

    // 获取可用性数据
    const availability = db.getAvailability();

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('获取号源信息失败:', error);
    res.status(500).json({
      success: false,
      message: "获取号源信息失败"
    });
  }
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('正在关闭数据库连接...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('正在关闭数据库连接...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  // 初始化时清理过期数据
  db.cleanExpiredAppointments();
  console.log(`Appointment service listening on http://localhost:${PORT}`);
  console.log('数据库已初始化，支持数据持久化存储');
});
