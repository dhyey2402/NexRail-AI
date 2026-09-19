"""
Main entry point for the FastAPI application.
Configures middleware, routes, and application metadata.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import train, weather, prediction, simulation, dashboard
from app.database.connection import engine
from app.models import Base

from app.services.ai.prediction_service import PredictionService

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for FastAPI.
    Handles startup database initialization and ML model artifact preloading.
    """
    try:
        # Create all tables automatically
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully initialized the database and created tables.")
    except Exception as e:
        logger.error(f"Failed to initialize the database: {e}")

    try:
        # Load ML model once during startup
        PredictionService.load_model()
        logger.info("Successfully loaded ML model artifacts during startup.")
    except Exception as e:
        logger.error(f"Failed to load ML model during startup: {e}", exc_info=True)
        raise RuntimeError(f"Startup aborted: failed to load ML model artifacts: {e}") from e
    
    yield


# Initialize FastAPI application
app = FastAPI(
    title="NexRail AI",
    version="1.0",
    description="AI-powered Train ETA Prediction System for Smart India Hackathon 2026.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
# Single source of truth from configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import train, weather, prediction, simulation, dashboard, auth

# Include API routers from the app.api module
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(train.router, prefix="/api/train", tags=["Train"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(prediction.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(simulation.router, prefix="/api/simulate", tags=["Simulation"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/")
async def root():
    """
    Root endpoint to verify the API is running.
    """
    return {"message": "RailWise AI Backend Running"}

@app.get("/health")
async def health():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}

