"""
API Router for train delay and ETA prediction endpoints.
"""
from fastapi import APIRouter, Depends
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.dependencies import get_prediction_service
from app.services.ai.prediction_service import PredictionService

router = APIRouter(tags=["Prediction"])


@router.post(
    "/",
    response_model=PredictionResponse,
    summary="Generate Train ETA & Delay Prediction",
    description="Uses the trained production LightGBM pipeline with SHAP explainability and calibrated confidence scoring to predict train delay and arrival ETA.",
    responses={
        200: {
            "description": "Successful prediction generated.",
            "model": PredictionResponse
        },
        400: {
            "description": "Invalid journey features or missing mandatory fields.",
            "content": {
                "application/json": {
                    "example": {"detail": "Input validation error: Missing required prediction features: train_number"}
                }
            }
        },
        500: {
            "description": "AI model execution failed.",
            "content": {
                "application/json": {
                    "example": {"detail": "Prediction service encountered an error: ..."}
                }
            }
        }
    }
)
async def create_prediction(
    request: PredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """
    Generate an ETA prediction for a train journey.
    Receives request, delegates to PredictionService, and returns ML prediction.
    """
    data = await prediction_service.predict(request)
    return PredictionResponse(**data)
