from fastapi import APIRouter, Depends, Path, HTTPException
from app.schemas.train import TrainResponse
from app.dependencies import get_train_service
from app.services.external.train_service import TrainService

router = APIRouter(tags=["Train"])

@router.get(
    "/{train_number}", 
    response_model=TrainResponse, 
    summary="Get live train status",
    description="Fetches live location, speed, and delay status for a specific train using the external train tracking service.",
    responses={
        200: {
            "description": "Successful retrieval of train data.",
            "model": TrainResponse
        }, 
        404: {
            "description": "Train not found. The provided train number does not exist in the live tracking system.",
            "content": {
                "application/json": {
                    "example": {"detail": "Train 12050 not found"}
                }
            }
        },
        500: {
            "description": "Internal server error. External tracking service might be down.",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to communicate with external tracking service"}
                }
            }
        }
    }
)
async def get_train(
    train_number: str = Path(..., description="The unique alphanumeric identifier of the train", examples=["12050"]),
    train_service: TrainService = Depends(get_train_service)
):
    """
    Get live status and details for a specific train.
    """
    try:
        # Call injected TrainService to fetch live tracking telemetry from RailRadar (cached in SQLite)
        data = await train_service.get_live_train(train_number=train_number)
        return TrainResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error while fetching train data: {str(e)}")
