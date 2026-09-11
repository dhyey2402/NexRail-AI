"""
API Router for what-if scenario counterfactual simulations.
"""
from fastapi import APIRouter, Depends
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.dependencies import get_simulation_service
from app.services.ai.simulation_service import SimulationService
from app.dependencies.auth import require_role

router = APIRouter(
    tags=["Simulation"],
    dependencies=[Depends(require_role(["PASSENGER", "ADMIN"]))],
)


@router.post(
    "/",
    response_model=SimulationResponse,
    summary="Run Counterfactual Operational Simulation",
    description="Simulates 'what-if' operational disruptions and infrastructure bottlenecks (e.g. single track, late incoming rake) comparing baseline against scenario predictions.",
    responses={
        200: {
            "description": "Simulation completed successfully.",
            "model": SimulationResponse
        },
        400: {
            "description": "Invalid scenario parameters or baseline features.",
            "content": {
                "application/json": {
                    "example": {"detail": "Original features validation error: Missing required prediction features: train_number"}
                }
            }
        },
        500: {
            "description": "Simulation engine failure.",
            "content": {
                "application/json": {
                    "example": {"detail": "Simulation service encountered an error: ..."}
                }
            }
        }
    }
)
async def run_simulation(
    request: SimulationRequest,
    simulation_service: SimulationService = Depends(get_simulation_service)
):
    """
    Run a counterfactual simulation evaluating scenario impacts on arrival ETA and delay.
    Receives request, delegates to SimulationService, and returns structured comparison results.
    """
    data = await simulation_service.simulate(request)
    return SimulationResponse(**data)
