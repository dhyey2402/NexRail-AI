from datetime import datetime
from sqlalchemy import Float, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    latitude: Mapped[float] = mapped_column(Float, index=True)
    longitude: Mapped[float] = mapped_column(Float, index=True)
    temperature: Mapped[float] = mapped_column(Float)
    humidity: Mapped[float] = mapped_column(Float)
    visibility: Mapped[float] = mapped_column(Float)
    weather_condition: Mapped[str] = mapped_column(String(100))
    wind_speed: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall: Mapped[float] = mapped_column(Float)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
