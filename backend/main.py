#!/home/yope/.projects/code/complete_ai_tutor_platform/backend/.venv/bin/python

import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True, #settings.debug,
        log_level="info"
    )
