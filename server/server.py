"""
uvicorn server:app --reload
"""

from typing import Optional

import logging
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from fetchers import PlanetTerpFetcher
import utils

# --------------------------------------------------
#  FastAPI app + global exception handler
# --------------------------------------------------


app = FastAPI(
    title="PlanetTerp REST API proxy",
    version="1.3.0",
    description="Thin REST service exposing cached PlanetTerp data",
)

# CORS for quick testing — restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.testudo.umd.edu"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

from starlette.middleware.base import BaseHTTPMiddleware
async def add_cors_header(request: Request, call_next):
     response = await call_next(request)
     response.headers["Access-Control-Allow-Origin"] = "https://app.testudo.umd.edu"
     response.headers.setdefault("Vary", "Origin")
     return response

app.add_middleware(BaseHTTPMiddleware, dispatch=add_cors_header)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error("Unhandled exception on %s: %s",
                  request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=502,
        content={
            "detail": "Upstream service error",
            "reason": str(exc),
        },
    )


_fetcher = PlanetTerpFetcher()


async def weekly_prefetch():
    _fetcher.prefetchAllCourseData()
    await _fetcher.prefetchAllProfessorData()

# Set up the scheduler
scheduler = BackgroundScheduler()
trigger = CronTrigger(hour=0, minute=0, day_of_week=0)  # midnight every day
scheduler.add_job(weekly_prefetch, trigger)
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
