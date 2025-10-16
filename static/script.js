// Event listeners for search button and Enter key
document.getElementById("searchBtn").addEventListener("click", getForecast);
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") getForecast();
});

// Default static background
document.addEventListener("DOMContentLoaded", () => {
  const bgEl = document.getElementById("weatherBackground");
  if (bgEl) {
    bgEl.style.backgroundImage = "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')";
    bgEl.style.backgroundSize = "cover";
    bgEl.style.backgroundPosition = "center";
  }
});

// Main forecast function
async function getForecast() {
  const inputEl = document.getElementById("cityInput");
  const city = inputEl.value.trim();
  const errorEl = document.getElementById("error-message");
  const cityEl = document.getElementById("cityName");
  const container = document.getElementById("forecastContainer");

  if (!city) {
    errorEl.textContent = "Please enter a city name.";
    inputEl.classList.add("shake");
    inputEl.addEventListener("animationend", () => inputEl.classList.remove("shake"), { once: true });
    return;
  }

  errorEl.textContent = "";
  cityEl.textContent = "Loading...";
  container.innerHTML = "";

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&t=${Date.now()}`);
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response. Please try again.");
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");

    cityEl.textContent = `Weather Forecast for ${data.city}`;
    renderForecast(data.forecast);

  } catch (err) {
    cityEl.textContent = "";
    errorEl.textContent = err.message;
    console.error("Error fetching weather:", err);
  }
}

// Render forecast cards dynamically using API icons
function renderForecast(forecast) {
  const container = document.getElementById("forecastContainer");
  container.innerHTML = "";

  forecast.forEach((day, i) => {
    const card = document.createElement("div");
    card.classList.add("card");

    // Format date (works with both One Call 3.0 and 5-day forecast)
    const formattedDate = new Date(day.date).toDateString();

    // OpenWeather icon
    const iconUrl = day.icon
      ? `https://openweathermap.org/img/wn/${day.icon}@2x.png`
      : "";

    card.innerHTML = `
      <h3>${formattedDate}</h3>
      ${iconUrl ? `<img src="${iconUrl}" alt="${day.description}" class="weather-icon" style="opacity:0; transition: opacity 1s ease-in-out;">` : ""}
      <p>${day.description}</p>
      <p><strong>${day.temp}°C</strong></p>
    `;

    container.appendChild(card);

    // Smooth fade-in for icons
    const img = card.querySelector(".weather-icon");
    if (img) {
      img.addEventListener("load", () => {
        img.style.opacity = 1;
      });

      img.addEventListener("error", () => {
        img.style.opacity = 1;
      });
    }

    // Stagger card entry animation
    setTimeout(() => card.classList.add("show"), i * 100);
  });
}
