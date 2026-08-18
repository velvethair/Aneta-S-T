const SUPABASE_URL = "https://rrzhahtngfyibmluywnx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5h-dxVdOY5NoXcy0EgWjuA_aX2j4jpt";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// FORM ELEMENTS
// ==========================================

const bookingForm = document.getElementById("bookingForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const serviceInput = document.getElementById("service");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const bookingButton = document.getElementById("bookingButton");
const formMessage = document.getElementById("formMessage");


// ==========================================
// AVAILABLE TIMES
// ==========================================

const availableTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];


// ==========================================
// TODAY
// ==========================================

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

dateInput.min = getTodayString();


// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, success = false) {
  formMessage.textContent = message;

  formMessage.style.color = success
    ? "#3d8b62"
    : "#b86f87";
}


// ==========================================
// RESET TIME
// ==========================================

function resetTimeSelect(message = "Прво избери датум") {
  timeInput.innerHTML = "";

  const option = document.createElement("option");

  option.value = "";
  option.textContent = message;

  timeInput.appendChild(option);
}


// ==========================================
// LOAD AVAILABLE TIMES
// ==========================================

async function loadAvailableTimes() {
  const selectedDate = dateInput.value;

  if (!selectedDate) {
    resetTimeSelect();
    return;
  }

  resetTimeSelect("Се вчитуваат термините...");
  showMessage("");

  try {

    const { data, error } = await supabaseClient
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", selectedDate);

    if (error) {

      console.error("SUPABASE ERROR:", error);
      console.error("MESSAGE:", error.message);
      console.error("CODE:", error.code);
      console.error("DETAILS:", error.details);
      console.error("HINT:", error.hint);

      resetTimeSelect("Грешка при вчитување");

      showMessage(
        "Грешка: " +
        (error.message || "Непозната грешка")
      );

      return;
    }

    const bookedTimes = (data || []).map(
      booking => String(booking.booking_time).slice(0, 5)
    );

    const freeTimes = availableTimes.filter(
      time => !bookedTimes.includes(time)
    );

    timeInput.innerHTML = "";

    if (freeTimes.length === 0) {

      const option = document.createElement("option");

      option.value = "";
      option.textContent =
        "Нема слободни термини за овој датум";

      timeInput.appendChild(option);

      return;
    }

    const firstOption = document.createElement("option");

    firstOption.value = "";
    firstOption.textContent =
      "Избери слободен термин";

    timeInput.appendChild(firstOption);

    freeTimes.forEach(time => {

      const option = document.createElement("option");

      option.value = time;
      option.textContent = time;

      timeInput.appendChild(option);

    });

  } catch (error) {

    console.error("GENERAL ERROR:", error);

    resetTimeSelect("Грешка при поврзување");

    showMessage(
      "Се појави проблем со поврзувањето."
    );
  }
}


// ==========================================
// DATE CHANGE
// ==========================================

dateInput.addEventListener(
  "change",
  loadAvailableTimes
);


// ==========================================
// BOOKING
// ==========================================

bookingForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const service = serviceInput.value;
    const bookingDate = dateInput.value;
    const bookingTime = timeInput.value;

    if (
      !name ||
      !phone ||
      !service ||
      !bookingDate ||
      !bookingTime
    ) {

      showMessage(
        "Ве молиме пополнете ги сите полиња."
      );

      return;
    }

    bookingButton.disabled = true;
    bookingButton.textContent = "Се резервира...";

    showMessage("");

    try {

      const { data, error } =
        await supabaseClient
          .from("bookings")
          .insert([
            {
              name: name,
              phone: phone,
              service: service,
              booking_date: bookingDate,
              booking_time: bookingTime
            }
          ])
          .select();

      if (error) {

        console.error("BOOKING ERROR:", error);

        if (error.code === "23505") {

          showMessage(
            "❌ Овој термин веќе е резервиран. Изберете друг термин."
          );

          await loadAvailableTimes();

          return;
        }

        showMessage(
          "❌ Резервацијата не успеа: " +
          (error.message || "Непозната грешка")
        );

        return;
      }

      console.log("BOOKING CREATED:", data);

      showMessage(
        "✅ Успешно! Терминот е резервиран.",
        true
      );

      nameInput.value = "";
      phoneInput.value = "";
      serviceInput.value = "";
      dateInput.value = "";

      resetTimeSelect();

    } catch (error) {

      console.error("FINAL ERROR:", error);

      showMessage(
        "❌ Се појави грешка. Обидете се повторно."
      );

    } finally {

      bookingButton.disabled = false;
      bookingButton.textContent = "Закажи термин";

    }
  }
);


// ==========================================
// SMOOTH NAVIGATION
// ==========================================

document.querySelectorAll("nav a").forEach(link => {

  link.addEventListener("click", function(event) {

    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();

    target.scrollIntoView({
      behavior: "smooth"
    });

  });

});


// ==========================================
// INITIAL
// ==========================================

resetTimeSelect();
