from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.ast_routes import router as ast_router
from backend.app.api.amr_routes import router as amr_router
from backend.app.api.genomics_routes import router as genomics_router
from backend.app.api.surveillance_routes import router as surveillance_router
from backend.app.api.auth_routes import router as auth_router
from backend.app.api.report_routes import router as report_router

app = FastAPI(
    title="AMR Sentinel API",
    description=(
        "AI-Powered Antimicrobial Resistance Surveillance & Prediction Platform. "
        "Strictly for research, educational, and population-level epidemiological analysis."
    ),
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "AMR Sentinel",
        "version": "1.1.0",
        "mode": "Research & Educational Surveillance Engine"
    }

# Register API routers
app.include_router(auth_router, prefix="/api")
app.include_router(ast_router, prefix="/api")
app.include_router(amr_router, prefix="/api")
app.include_router(genomics_router, prefix="/api")
app.include_router(surveillance_router, prefix="/api")
app.include_router(report_router, prefix="/api")

# Top-level direct aliases
app.include_router(surveillance_router, prefix="/api/v1")
