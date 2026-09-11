# RailWise AI Backend

AI-powered Train ETA Prediction System for Smart India Hackathon.

## Setup Instructions

1. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Review and update the `.env` file in the root directory.

4. **Run the development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access the interactive API documentation (Swagger UI) at:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
