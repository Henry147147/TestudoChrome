"""
uvicorn server:app --reload
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
import logging

from fetchers import PlanetTerpFetcher
import utils          # (kept from your file)

# ------------------------------------------------------------------
#  Create ONE FastAPI instance
# ------------------------------------------------------------------
app = FastAPI(
    title="PlanetTerp REST API proxy",
    version="1.3.0",
    description="Thin REST service exposing cached PlanetTerp data",
)

# ------------------------------------------------------------------
#  CORS – allow Testudo and Chrome-extension origins
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://testudo.umd.edu"],
    # any extension ID, any path
    allow_origin_regex=r"^chrome-extension://[a-z0-9_]+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
#  Global error handler
# ------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=502,
        content={"detail": "Upstream service error", "reason": str(exc)},
    )

# ------------------------------------------------------------------
#  Background pre-fetch job
# ------------------------------------------------------------------
_fetcher = PlanetTerpFetcher()

async def weekly_prefetch():
    _fetcher.prefetchAllCourseData()
    await _fetcher.prefetchAllProfessorData()

scheduler = BackgroundScheduler()
scheduler.add_job(weekly_prefetch, trigger=CronTrigger(hour=0, minute=0, day_of_week=0))
scheduler.start()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    scheduler.shutdown()


# --------------------------------------------------
#  Course endpoints
# --------------------------------------------------
@app.get(
    "/class/{course}/reviews/{professor}",
    summary="Reviews for a course, filtered to one professor",
)
async def class_reviews(course: str, professor: Optional[str] = None):
    """
    Return course information and reviews.

    If **professor** is supplied, only that professor’s reviews are returned.
    """
    return await _fetcher.getClassReviews(course, professor)


@app.get("/class/{course}/grades", summary="Grade distribution for a course")
@app.get(
    "/class/{course}/grades/{professor}",
    summary="Grade distribution for a course taught by one professor",
)
async def class_grades(course: str, professor: Optional[str] = None):
    """
    Return grade distribution for a course.

    If **professor** is supplied, results are limited to that professor.
    """
    return _fetcher.getClassGrades(course, professor)


# --------------------------------------------------
#  Professor endpoints
# --------------------------------------------------
@app.get("/professor/{name}/ratings", summary="Professor ratings + reviews")
async def professor_ratings(name: str):
    """Return ratings, difficulty, and review data for *name*."""
    return await _fetcher.getProfessorRatings(name, reviews=False)


@app.get("/professor/{name}/reviews", summary="Professor ratings + reviews")
async def professor_reviews(name: str):
    """Return ratings, difficulty, and review data for *name*."""
    return await _fetcher.getProfessorRatings(name, reviews=True)


@app.get("/professor/{name}/grades", summary="All grades for a professor")
async def professor_grades(name: str):
    """Return aggregated grade distributions for courses taught by *name*."""
    return _fetcher.getProfessorGrades(name)


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}
