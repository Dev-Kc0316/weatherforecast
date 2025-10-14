from flask import Flask, render_template, request, jsonify
import requests
import os
from datetime import datetime
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "YOUR_FALLBACK_API_KEY_HERE")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/weather", methods=["GET"])
def get_weather():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City is required"}), 400

    #Get coordinates from city name
    geo_url = "http://api.openweathermap.org/geo/1.0/direct"
    geo_params = {"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY}
    geo_response = requests.get(geo_url, params=geo_params)
    geo_data = geo_response.json()

    if not geo_data or "lat" not in geo_data[0]:
        return jsonify({"error": "City not found"}), 404

    lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]

    #Try One Call 3.0 first
    weather_url = "https://api.openweathermap.org/data/3.0/onecall"
    weather_params = {
        "lat": lat,
        "lon": lon,
        "exclude": "minutely,hourly,alerts",
        "units": "metric",
        "appid": OPENWEATHER_API_KEY
    }

    weather_response = requests.get(weather_url, params=weather_params)
    weather_data = weather_response.json()

    #If One Call 3.0 fails or invalid response, fall back to 2.5 forecast
    if "daily" not in weather_data:
        print("⚠ Falling back to Forecast 2.5 API...")

        fallback_url = "https://api.openweathermap.org/data/2.5/forecast"
        fallback_params = {
            "q": city,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY
        }
        fallback_response = requests.get(fallback_url, params=fallback_params)
        fallback_data = fallback_response.json()

        if fallback_response.status_code != 200 or "list" not in fallback_data:
            return jsonify({
                "error": "Unable to fetch weather data from OpenWeather."
            }), 500

        #Build daily summaries from 5-day / 3-hour forecast
        forecast = []
        for i in range(0, len(fallback_data["list"]), 8):  #roughly 1 entry per day
            day = fallback_data["list"][i]
            forecast.append({
                "date": day["dt_txt"],
                "temp": round(day["main"]["temp"]),
                "temp_min": round(day["main"]["temp_min"]),
                "temp_max": round(day["main"]["temp_max"]),
                "description": day["weather"][0]["description"].title(),
                "icon": day["weather"][0]["icon"]
            })

        return jsonify({
            "city": fallback_data["city"]["name"],
            "forecast": forecast
        })

    #If One Call 3.0 succeeded
    forecast = []
    for day in weather_data["daily"][:7]:
        forecast.append({
            "date": datetime.utcfromtimestamp(day["dt"]).strftime("%A, %d %B"),
            "temp": round(day["temp"]["day"]),
            "temp_min": round(day["temp"]["min"]),
            "temp_max": round(day["temp"]["max"]),
            "description": day["weather"][0]["description"].title(),
            "icon": day["weather"][0]["icon"]
        })

    return jsonify({
        "city": city.title(),
        "forecast": forecast
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)