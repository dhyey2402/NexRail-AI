import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

url = "https://api.openweathermap.org/data/2.5/weather"

params = {
    "q": "Ahmedabad",
    "appid": API_KEY,
    "units": "metric"
}

response = requests.get(url, params=params)

print(response.status_code)
print(response.json())