const SUPABASE_URL =
  "https://rrzhahtngfyibmluywnx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "YOUR_PUBLISHABLE_KEY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

const bookingForm =
  document.getElementById("bookingForm");

const nameInput =
  document.getElementById("name");

const phoneInput =
  document.getElementById("phone");

const serviceInput =
  document.getElementById("service");

const dateInput =
  document.getElementById("date");

const timeInput =
  document.getElementById("time");

const bookingButton =
  document.getElementById("bookingButton");

const formMessage =
  document.getElementById("formMessage");


/* ==========================================
   ТЕРМИНИ 09:00 - 18:00
========================================== */

const availableTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00"
];


/* ==========================================
   ДЕНЕШЕН ДАТУМ
========================================== */

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

dateInput.min = getTodayString();


/* ==========================================
   ИЗБОР НА УСЛУГА
========================================== */

window.selectService = function(service) {

  serviceInput.value = service;

  const booking =
    document.getElementById("booking");

  if (booking) {

    setTimeout(function() {

      booking.scrollIntoView({
        behavior: "smooth"
      });

    }, 50);

  }
};


/* ==========================================
   ПОРАКА
========================================== */

function showMessage(
  message,
  success = false
) {

  formMessage.textContent =
    message;

  formMessage.style.color =
    success
      ? "#536b58"
      : "#a4953f";
}


/* ==========================================
   RESET НА ТЕРМИНИ
========================================== */

function resetTimeSelect(
  message = "Прво избери датум"
) {

  timeInput.innerHTML = "";

  const option =
    document.createElement("option");

  option.value = "";
  option.textContent = message;

  timeInput.appendChild(option);
}


/* ==========================================
   ПРОВЕРКА ЦЕЛ ДЕН
========================================== */

async function isDateBlocked(date) {

  const {
    data,
    error
  } =
    await supabaseClient.rpc(
      "is_date_blocked",
      {
        p_date: date
      }
    );

  if (error) {

    console.error(
      "BLOCKED DATE ERROR:",
      error
    );

    return false;
  }

  return data === true;
}


/* ==========================================
   ЗЕМИ БЛОКИРАНИ ЧАСОВИ
========================================== */

async function getBlockedTimes(date) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("blocked_times")
      .select("blocked_time")
      .eq(
        "blocked_date",
        date
      );

  if (error) {

    console.error(
      "BLOCKED TIMES ERROR:",
      error
    );

    return [];
  }

  return (data || []).map(
    item =>
      String(
        item.blocked_time
      ).slice(0, 5)
  );
}


/* ==========================================
   ВЧИТАЈ СЛОБОДНИ ТЕРМИНИ
========================================== */

async function loadAvailableTimes() {

  const selectedDate =
    dateInput.value;

  if (!selectedDate) {

    resetTimeSelect();

    return;
  }

  resetTimeSelect(
    "Се проверува датумот..."
  );

  showMessage("");


  try {

    /* ЦЕЛ ДЕН БЛОКИРАН */

    const blockedDay =
      await isDateBlocked(
        selectedDate
      );


    if (blockedDay) {

      resetTimeSelect(
        "Нема термини - датумот е блокиран"
      );

      showMessage(
        "Овој датум не е достапен за закажување."
      );

      return;
    }


    /* БЛОКИРАНИ ЧАСОВИ */

    const blockedTimes =
      await getBlockedTimes(
        selectedDate
      );


    /* ВЕЌЕ РЕЗЕРВИРАНИ ЧАСОВИ */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "get_booked_times",
        {
          p_date: selectedDate
        }
      );


    if (error) {

      console.error(
        "BOOKED TIMES ERROR:",
        error
      );

      resetTimeSelect(
        "Грешка при вчитување"
      );

      showMessage(
        "Грешка: " +
        (
          error.message ||
          "Непозната грешка"
        )
      );

      return;
    }


    const bookedTimes =
      (data || []).map(
        booking =>
          String(
            booking.booking_time
          ).slice(0, 5)
      );


    /* ГИ ТРГАМЕ И РЕЗЕРВИРАНИТЕ
       И БЛОКИРАНИТЕ ЧАСОВИ */

    const freeTimes =
      availableTimes.filter(
        time =>
          !bookedTimes.includes(time) &&
          !blockedTimes.includes(time)
      );


    timeInput.innerHTML = "";


    if (
      freeTimes.length === 0
    ) {

      resetTimeSelect(
        "Нема слободни термини за овој датум"
      );

      return;
    }


    const firstOption =
      document.createElement(
        "option"
      );

    firstOption.value = "";

    firstOption.textContent =
      "Избери слободен термин";

    timeInput.appendChild(
      firstOption
    );


    freeTimes.forEach(
      function(time) {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          time;

        option.textContent =
          time;

        timeInput.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "GENERAL ERROR:",
      error
    );

    resetTimeSelect(
      "Грешка при поврзување"
    );

    showMessage(
      "Се појави проблем со поврзувањето."
    );

  }
}


/* ==========================================
   ДАТУМ
========================================== */

dateInput.addEventListener(
  "change",
  loadAvailableTimes
);


/* ==========================================
   РЕЗЕРВАЦИЈА
========================================== */

bookingForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    const name =
      nameInput.value.trim();

    const phone =
      phoneInput.value.trim();

    const service =
      serviceInput.value;

    const bookingDate =
      dateInput.value;

    const bookingTime =
      timeInput.value;


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


    bookingButton.disabled =
      true;

    bookingButton.textContent =
      "Се резервира...";


    try {

      /* ПРОВЕРКА НА ЦЕЛ ДЕН */

      const blockedDay =
        await isDateBlocked(
          bookingDate
        );


      if (blockedDay) {

        showMessage(
          "Овој датум е блокиран."
        );

        await loadAvailableTimes();

        return;
      }


      /* ПРОВЕРКА НА ЧАС */

      const blockedTimes =
        await getBlockedTimes(
          bookingDate
        );


      if (
        blockedTimes.includes(
          bookingTime
        )
      ) {

        showMessage(
          "Овој термин е блокиран."
        );

        await loadAvailableTimes();

        return;
      }


      /* КРЕИРАЊЕ РЕЗЕРВАЦИЈА */

      const {
        error
      } =
        await supabaseClient
          .from("bookings")
          .insert([
            {
              name:
                name,

              phone:
                phone,

              service:
                service,

              booking_date:
                bookingDate,

              booking_time:
                bookingTime
            }
          ]);


      if (error) {

        console.error(
          "BOOKING ERROR:",
          error
        );


        if (
          error.code ===
          "23505"
        ) {

          showMessage(
            "Овој термин веќе е резервиран."
          );

          await loadAvailableTimes();

          return;
        }


        showMessage(
          "Резервацијата не успеа: " +
          error.message
        );

        return;
      }


      showMessage(
        "✅ Успешно! Терминот е резервиран.",
        true
      );


      nameInput.value = "";
      phoneInput.value = "";
      serviceInput.value = "";
      dateInput.value = "";

      resetTimeSelect(
        "Прво избери датум"
      );


    } catch (error) {

      console.error(
        "FINAL ERROR:",
        error
      );

      showMessage(
        "❌ Се појави грешка. Обидете се повторно."
      );


    } finally {

      bookingButton.disabled =
        false;

      bookingButton.textContent =
        "Закажи термин";

    }

  }
);


/* ==========================================
   ПОЧЕТНА СОСТОЈБА
========================================== */

resetTimeSelect(
  "Прво избери датум"
);
