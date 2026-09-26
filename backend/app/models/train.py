from datetime import datetime
from sqlalchemy import String, Float, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class TrainCache(Base):
    __tablename__ = "train_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    train_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    train_name: Mapped[str] = mapped_column(String(150), default="")
    current_station: Mapped[str] = mapped_column(String(100))
    next_station: Mapped[str] = mapped_column(String(100))
    current_delay: Mapped[float] = mapped_column(Float)
    speed: Mapped[float] = mapped_column(Float)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    stations: Mapped[list] = mapped_column(JSON, default=list)
