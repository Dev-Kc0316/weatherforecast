// Event listeners for search button and Enter key
document.getElementById("searchBtn").addEventListener("click", getForecast);
document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") getForecast();
});

// Main forecast function
async function getForecast() {
    const city = document.getElementById("cityInput").value.trim();
    const errorEl = document.getElementById("error-message");
    const cityEl = document.getElementById("cityName");
    const container = document.getElementById("forecastContainer");

    // Check if city is entered
    if (!city) {
        errorEl.textContent = "Please enter a city name.";
        return;
    }

    // Reset previous states
    errorEl.textContent = "";
    cityEl.textContent = "Loading...";
    container.innerHTML = "";

    try {
        // Fetch weather data from backend
        const response = await fetch(`http://127.0.0.1:5000/api/weather?city=${encodeURIComponent(city)}`);
        const contentType = response.headers.get("content-type");

        // Validate that the backend returned JSON
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server returned an invalid response. Please try again.");
        }

        const data = await response.json();

        // Handle backend error responses
        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        // Display forecast
        cityEl.textContent = `Weather Forecast for ${data.city}`;
        renderForecast(data.forecast);

    } catch (err) {
        cityEl.textContent = "";
        errorEl.textContent = err.message;
        console.error("Error fetching weather:", err);
    }
}

// Render forecast cards dynamically
function renderForecast(forecast) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    forecast.forEach(day => {
        const card = document.createElement("div");
        card.classList.add("card");

        // Convert date nicely
        const formattedDate = new Date(day.date).toDateString();

        card.innerHTML = `
            <h3>${formattedDate}</h3>
            <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
            <p>${day.description}</p>
            <p><strong>${day.temp}°C</strong></p>
        `;
        container.appendChild(card);
    });
}