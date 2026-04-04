from pydantic import BaseModel, ConfigDict
from datetime import datetime


class CertificateBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    course_id: int
    certificate_code: str
    issue_date: datetime
    created_at: datetime
    updated_at: datetime


class CertificateResponse(CertificateBase):
    content: str


class CertificateListResponse(CertificateBase):
    pass
