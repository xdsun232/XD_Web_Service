document.addEventListener("DOMContentLoaded", () => {
  // 初始化AOS动画库
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100
  });

  const API_BASE = "http://localhost:3000/api/appointment";

  const bookingForm = document.getElementById("booking-form");
  const cancelForm = document.getElementById("cancel-form");
  const availabilityBody = document.getElementById("availability-body");
  const messageContainer = document.getElementById("message-container");

  // 统计元素
  const totalDepartmentsEl = document.getElementById("total-departments");
  const totalAvailabilityEl = document.getElementById("total-availability");
  const updateTimeEl = document.getElementById("update-time");

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
    let totalSlots = 0;
    let totalBooked = 0;
    let departmentCount = Object.keys(data).length;

    Object.keys(data).forEach((department) => {
      data[department].forEach((slot) => {
        totalSlots += slot.available + slot.booked;
        totalBooked += slot.booked;

        const progressPercentage = totalSlots > 0 ? (slot.booked / (slot.available + slot.booked)) * 100 : 0;
        const progressColor = progressPercentage > 80 ? 'danger' : progressPercentage > 50 ? 'warning' : 'success';

        rows.push(`
          <tr data-aos="fade-up" data-aos-delay="${rows.length * 50}">
            <td>
              <span class="badge bg-primary rounded-pill">
                <i class="bi bi-hospital me-1"></i>${department}
              </span>
            </td>
            <td>
              <i class="bi bi-calendar-event me-1 text-muted"></i>
              ${formatDateDisplay(slot.date)}
            </td>
            <td>
              <span class="badge bg-success rounded-pill fs-6">
                <i class="bi bi-check-circle me-1"></i>${slot.available}
              </span>
            </td>
            <td>
              <span class="badge bg-info rounded-pill fs-6">
                <i class="bi bi-people me-1"></i>${slot.booked}
              </span>
            </td>
            <td>
              <div class="progress-wrapper">
                <div class="progress">
                  <div class="progress-bar bg-${progressColor}"
                       role="progressbar"
                       style="width: ${progressPercentage}%"
                       aria-valuenow="${slot.booked}"
                       aria-valuemin="0"
                       aria-valuemax="${slot.available + slot.booked}">
                    ${progressPercentage.toFixed(1)}%
                  </div>
                </div>
                <small class="text-muted">${slot.booked}/${slot.available + slot.booked}</small>
              </div>
            </td>
          </tr>
        `);
      });
    });

    availabilityBody.innerHTML =
      rows.join("") ||
      `<tr><td colspan="5" class="text-center py-4 text-muted">
        <i class="bi bi-inbox me-2"></i>暂无号源信息
      </td></tr>`;

    // 更新统计信息
    updateStatistics(departmentCount, totalSlots, totalBooked);
  }

  function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === formatDate(tomorrow)) {
      return `明天 (${dateStr})`;
    } else {
      return `后天 (${dateStr})`;
    }
  }

  function updateStatistics(departmentCount, totalSlots, totalBooked) {
    // 动画更新数字
    animateValue(totalDepartmentsEl, 0, departmentCount, 1000);
    animateValue(totalAvailabilityEl, 0, totalSlots, 1000);

    // 更新时间
    const now = new Date();
    updateTimeEl.textContent = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current);
      }
    }, 16);
  }

  function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // 显示加载状态
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>预约中...';

    const date = bookingDateInput.value;
    const department = bookingDepartmentSelect.value;
    const phone = bookingPhoneInput.value.trim();

    // 表单验证
    if (!date || !department || !phone) {
      showMessage("warning", "请完整填写预约信息");
      resetButton(submitBtn, originalText);
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage("warning", "请输入有效的11位手机号");
      shakeElement(bookingPhoneInput);
      resetButton(submitBtn, originalText);
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
        showMessage("success", `🎉 ${result.message || "预约成功"}！预约ID: ${result.data?.id || 'N/A'}`);
        bookingForm.reset();
        setBookingDateBounds();

        // 成功动画
        confetti(submitBtn);
      } else {
        showMessage("danger", `❌ ${result.message || "预约失败"}`);
        shakeElement(submitBtn);
      }
    } catch (error) {
      showMessage("danger", `🔌 ${error.message || "网络请求出错"}`);
      shakeElement(submitBtn);
    } finally {
      resetButton(submitBtn, originalText);
      fetchAvailability();
    }
  });

  cancelForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = cancelForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // 显示加载状态
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>取消中...';

    const phone = cancelPhoneInput.value.trim();
    if (!phone) {
      showMessage("warning", "请填写要取消预约的手机号");
      resetButton(submitBtn, originalText);
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage("warning", "请输入有效的11位手机号");
      shakeElement(cancelPhoneInput);
      resetButton(submitBtn, originalText);
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
        showMessage("success", `✅ ${result.message || "取消预约成功"}`);
        cancelForm.reset();

        // 成功动画
        pulseElement(submitBtn);
      } else {
        showMessage("danger", `❌ ${result.message || "取消预约失败"}`);
        shakeElement(submitBtn);
      }
    } catch (error) {
      showMessage("danger", `🔌 ${error.message || "网络请求出错"}`);
      shakeElement(submitBtn);
    } finally {
      resetButton(submitBtn, originalText);
      fetchAvailability();
    }
  });

  setBookingDateBounds();
  fetchAvailability();

  // 添加表单实时验证
  addFormValidation();

  // 添加导航栏平滑滚动
  addSmoothScroll();

  // 添加输入框焦点效果
  addInputEffects();
});

// 辅助函数
function resetButton(button, originalText) {
  button.disabled = false;
  button.innerHTML = originalText;
}

function shakeElement(element) {
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

function pulseElement(element) {
  element.classList.add('pulse-animation');
  setTimeout(() => {
    element.classList.remove('pulse-animation');
  }, 600);
}

function confetti(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 创建简单的庆祝效果
  const colors = ['#28a745', '#ffc107', '#17a2b8', '#6f42c1'];
  for (let i = 0; i < 20; i++) {
    createParticle(centerX, centerY, colors[Math.floor(Math.random() * colors.length)]);
  }
}

function createParticle(x, y, color) {
  const particle = document.createElement('div');
  particle.style.position = 'fixed';
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.width = '8px';
  particle.style.height = '8px';
  particle.style.backgroundColor = color;
  particle.style.borderRadius = '50%';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  particle.style.transition = 'all 1s ease-out';

  document.body.appendChild(particle);

  const angle = (Math.PI * 2 * Math.random());
  const velocity = 50 + Math.random() * 50;
  const vx = Math.cos(angle) * velocity;
  const vy = Math.sin(angle) * velocity;

  setTimeout(() => {
    particle.style.transform = `translate(${vx}px, ${vy}px) scale(0)`;
    particle.style.opacity = '0';
  }, 10);

  setTimeout(() => {
    document.body.removeChild(particle);
  }, 1000);
}

function addFormValidation() {
  // 手机号实时验证
  bookingPhoneInput.addEventListener('input', function() {
    const value = this.value.trim();
    if (value.length === 11) {
      if (isValidPhone(value)) {
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
      } else {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      }
    } else {
      this.classList.remove('is-valid', 'is-invalid');
    }
  });

  cancelPhoneInput.addEventListener('input', function() {
    const value = this.value.trim();
    if (value.length === 11) {
      if (isValidPhone(value)) {
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
      } else {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      }
    } else {
      this.classList.remove('is-valid', 'is-invalid');
    }
  });

  // 科室选择验证
  bookingDepartmentSelect.addEventListener('change', function() {
    if (this.value) {
      this.classList.add('is-valid');
    } else {
      this.classList.remove('is-valid');
    }
  });

  // 日期选择验证
  bookingDateInput.addEventListener('change', function() {
    if (this.value) {
      this.classList.add('is-valid');
    } else {
      this.classList.remove('is-valid');
    }
  });
}

function addSmoothScroll() {
  // 导航链接平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // 更新活动状态
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
        });
        this.classList.add('active');
      }
    });
  });

  // 滚动时更新导航栏活动状态
  window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section, [id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  });
}

function addInputEffects() {
  const inputs = document.querySelectorAll('.form-control, .form-select');

  inputs.forEach(input => {
    // 焦点效果
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });

    // 输入动画
    input.addEventListener('input', function() {
      if (this.value.length > 0) {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
  });
}
