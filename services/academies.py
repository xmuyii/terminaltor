# Re-export from app.services.academies
from app.services.academies import (
    AcademiesService,
    generate_academy_join_code,
    SEAT_CAP_PREMIUM,
    SEAT_CAP_PRO,
    PRICE_PREMIUM_KOBO,
    PRICE_PRO_KOBO,
)

__all__ = [
    "AcademiesService",
    "generate_academy_join_code",
    "SEAT_CAP_PREMIUM",
    "SEAT_CAP_PRO",
    "PRICE_PREMIUM_KOBO",
    "PRICE_PRO_KOBO",
]
