"""
uvicorn server:app --reload
"""

from typing import Optional

import logging
from fastapi import FastAPI, Request
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=502,
        content={
            "detail": "Upstream service error",
            "reason": str(exc),
        },
    )


_fetcher = PlanetTerpFetcher()

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
