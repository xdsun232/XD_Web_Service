const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DEPARTMENTS = {
  内科: { name: "内科", maxSlots: 10 },
  外科: { name: "外科", maxSlots: 10 },
};

const store = {
  appointments: {},
  phoneToAppointment: {},
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBookingWindow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  return [formatDate(tomorrow), formatDate(dayAfterTomorrow)];
}

function isValidBookingDate(date) {
  const [tomorrow, dayAfterTomorrow] = getBookingWindow();
  return date >= tomorrow && date <= dayAfterTomorrow;
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

function ensureSchedule() {
  const validDates = new Set(getBookingWindow());

  Object.keys(DEPARTMENTS).forEach((departmentKey) => {
    if (!store.appointments[departmentKey]) {
      store.appointments[departmentKey] = {};
    }
    const schedule = store.appointments[departmentKey];

    Object.keys(schedule).forEach((date) => {
      if (!validDates.has(date)) {
        const phones = schedule[date];
        if (Array.isArray(phones)) {
          phones.forEach((phone) => {
            if (store.phoneToAppointment[phone]) {
              delete store.phoneToAppointment[phone];
            }
          });
        }
        delete schedule[date];
      }
    });

    validDates.forEach((date) => {
      if (!(date in schedule)) {
        schedule[date] = [];
      } else if (!Array.isArray(schedule[date])) {
        schedule[date] = schedule[date] ? [schedule[date]] : [];
      }
    });
  });

  Object.keys(store.phoneToAppointment).forEach((phone) => {
    const booking = store.phoneToAppointment[phone];
    if (!booking || !validDates.has(booking.date)) {
      delete store.phoneToAppointment[phone];
    }
  });
}

app.post("/api/appointment/book", (req, res) => {
  const { date, department, phone } = req.body || {};
  ensureSchedule();

  if (!date || !department || !phone) {
    return res.status(400).json({ success: false, message: "缺少必要参数" });
  }

  if (!isValidBookingDate(date)) {
    return res
      .status(400)
      .json({ success: false, message: "不在预订日期内" });
  }

  if (!DEPARTMENTS[department]) {
    return res.status(400).json({ success: false, message: "无效科室" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "无效手机号" });
  }

  if (store.phoneToAppointment[phone]) {
    return res.status(400).json({ success: false, message: "该手机号已预约" });
  }

  const schedule = store.appointments[department];

  if (!(date in schedule)) {
    schedule[date] = [];
  }

  const maxSlots = DEPARTMENTS[department].maxSlots;
  const slots = schedule[date];

  if (slots.length >= maxSlots) {
    return res.status(400).json({ success: false, message: "暂无预约号" });
  }

  slots.push(phone);
  store.phoneToAppointment[phone] = { department, date };

  return res.json({
    success: true,
    message: "预约成功",
    data: { department, date, phone },
  });
});

app.post("/api/appointment/cancel", (req, res) => {
  const { phone } = req.body || {};
  ensureSchedule();

  if (!phone) {
    return res.status(400).json({ success: false, message: "缺少手机号" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "无效手机号" });
  }

  const booking = store.phoneToAppointment[phone];
  if (!booking) {
    return res.status(404).json({ success: false, message: "该手机号无预约" });
  }

  const { department, date } = booking;
  const slots = store.appointments[department][date] || [];
  store.appointments[department][date] = slots.filter((p) => p !== phone);
  delete store.phoneToAppointment[phone];

  return res.json({ success: true, message: "取消预约成功" });
});

app.get("/api/appointment/availability", (req, res) => {
  ensureSchedule();

  const availability = {};
  Object.keys(DEPARTMENTS).forEach((departmentKey) => {
    const schedule = store.appointments[departmentKey];
    const maxSlots = DEPARTMENTS[departmentKey].maxSlots;
    availability[departmentKey] = Object.keys(schedule).map((date) => ({
      date,
      ...(() => {
        const slots = Array.isArray(schedule[date]) ? schedule[date] : [];
        return {
          available: Math.max(maxSlots - slots.length, 0),
          booked: slots.length,
        };
      })(),
    }));
  });

  res.json({ success: true, data: availability });
});

app.listen(PORT, () => {
  ensureSchedule();
  console.log(`Appointment service listening on http://localhost:${PORT}`);
});
