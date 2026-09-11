from datetime import datetime
from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    train_number: Mapped[str] = mapped_column(String(50), index=True)
    train_name: Mapped[str] = mapped_column(String(150), default="")
    predicted_eta: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    predicted_delay: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    weather_condition: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), index=True
    )
