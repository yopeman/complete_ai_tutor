import os
import uuid
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
from app.models import User, Course, Certificate
from sqlalchemy.ext.asyncio import AsyncSession


class CertificateService:
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        self.env = Environment(loader=FileSystemLoader(template_dir))
        self.template_name = "certificate.html"

    async def generate_certificate(self, user: User, course: Course, db: AsyncSession) -> Certificate:
        # Generate a unique certificate code
        certificate_code = f"CERT-{uuid.uuid4().hex[:12].upper()}"
        issue_date = datetime.utcnow()
        
        # Prepare data for template
        template_data = {
            "user_name": user.username,
            "course_title": course.title,
            "issue_date": issue_date.strftime("%B %d, %Y"),
            "certificate_code": certificate_code
        }
        
        # Render template
        template = self.env.get_template(self.template_name)
        rendered_content = template.render(**template_data)
        
        # Create certificate record
        certificate = Certificate(
            user_id=user.id,
            course_id=course.id,
            certificate_code=certificate_code,
            issue_date=issue_date,
            content=rendered_content
        )
        
        db.add(certificate)
        await db.commit()
        await db.refresh(certificate)
        
        return certificate
