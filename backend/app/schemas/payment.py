from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class PaymentBase(BaseModel):
    user_id: int
    course_id: int
    amount: float
    status: str = "PENDING"


class PaymentCreate(PaymentBase):
    tx_ref: str


class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_data: Optional[Dict[str, Any]] = None


class PaymentResponse(PaymentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    tx_ref: str
    checkout_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ChapaCallback(BaseModel):
    # Depending on Chapa callback payload
    event: str
    data: Dict[str, Any]
