document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3000/api/appointment";

  const bookingForm = document.getElementById("booking-form");
  const cancelForm = document.getElementById("cancel-form");
  const availabilityBody = document.getElementById("availability-body");
  const messageContainer = document.getElementById("message-container");

  const bookingDateInput = document.getElementById("booking-date");
  const bookingDepartmentSelect = document.getElementById(
    "booking-department"
  );
  const bookingPhoneInput = document.getElementById("booking-phone");
  const cancelPhoneInput = document.getElementById("cancel-phone");

  function formatDate(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getBookingWindow() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    return [tomorrow, dayAfterTomorrow];
  }

  function setBookingDateBounds() {
    const [tomorrow, dayAfterTomorrow] = getBookingWindow();
    const minDate = formatDate(tomorrow);
    const maxDate = formatDate(dayAfterTomorrow);

    bookingDateInput.min = minDate;
    bookingDateInput.max = maxDate;

    if (
      !bookingDateInput.value ||
      bookingDateInput.value < minDate ||
      bookingDateInput.value > maxDate
    ) {
      bookingDateInput.value = minDate;
    }
  }

  function showMessage(type, text) {
    messageContainer.innerHTML = `
      <div class="alert alert-${type}" role="alert">
        ${text}
      </div>
    `;
  }

  function clearMessage() {
    messageContainer.innerHTML = "";
  }

  async function fetchAvailability() {
    try {
      const response = await fetch(`${API_BASE}/availability`);
      if (!response.ok) {
        throw new Error("无法获取号源信息");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "获取号源信息失败");
      }
      renderAvailability(result.data);
    } catch (error) {
      showMessage("danger", error.message);
    }
  }

  function renderAvailability(data) {
    const rows = [];

    Object.keys(data).forEach((department) => {
      data[department].forEach((slot) => {
        rows.push(`
          <tr>
            <td>${department}</td>
            <td>${slot.date}</td>
            <td>${slot.available}</td>
            <td>${slot.booked}</td>
          </tr>
        `);
      });
    });

    availabilityBody.innerHTML =
      rows.join("") ||
      `<tr><td colspan="4" class="text-center text-muted">暂无号源信息</td></tr>`;
  }

  function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const date = bookingDateInput.value;
    const department = bookingDepartmentSelect.value;
    const phone = bookingPhoneInput.value.trim();

    if (!date || !department || !phone) {
      showMessage("warning", "请完整填写预约信息");
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage("warning", "请输入有效的11位手机号");
      return;
    }

    clearMessage();

    try {
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, department, phone }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showMessage("success", result.message || "预约成功");
        bookingForm.reset();
        setBookingDateBounds();
      } else {
        showMessage("danger", result.message || "预约失败");
      }
    } catch (error) {
      showMessage("danger", error.message || "预约请求出错");
    } finally {
      fetchAvailability();
    }
  });

  cancelForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = cancelPhoneInput.value.trim();
    if (!phone) {
      showMessage("warning", "请填写要取消预约的手机号");
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage("warning", "请输入有效的11位手机号");
      return;
    }

    clearMessage();

    try {
      const response = await fetch(`${API_BASE}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showMessage("success", result.message || "取消预约成功");
        cancelForm.reset();
      } else {
        showMessage("danger", result.message || "取消预约失败");
      }
    } catch (error) {
      showMessage("danger", error.message || "取消预约请求出错");
    } finally {
      fetchAvailability();
    }
  });

  setBookingDateBounds();
  fetchAvailability();
});
