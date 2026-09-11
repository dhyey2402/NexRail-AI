import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("RAILRADAR_API_KEY")

TRAIN_NUMBER = "12951"   # Example: Mumbai Rajdhani

url = f"https://api.railradar.in/v1/trains/{TRAIN_NUMBER}"

headers = {
    "x-api-key": API_KEY
}
 
response = requests.get(url, headers=headers)

print("Status Code:", response.status_code)
print(response.json())