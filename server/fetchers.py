from __future__ import annotations

import json
import utils
import sqlite3
import time
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

import planetterp

_CACHE_PATH = ".cache.db"
_DEFAULT_TTL = 72 * 60 * 60  # 72 h


class _SQLCache:
    """Very small JSON-blob cache."""

    def __init__(self, path: Path = _CACHE_PATH) -> None:
        self.conn = sqlite3.connect(path)
        self._init_schema()

    # ---------- public helpers ---------- #
    def get(self, table: str, key: Tuple, ttl: int = _DEFAULT_TTL) -> Optional[Any]:
        cur = self.conn.execute(
            f"SELECT json, ts FROM {table} WHERE key1=? AND key2=?",
            key,
        )
        row = cur.fetchone()
        if not row:
            return None
        blob, ts = row
        if time.time() - ts > ttl:
            return None
        return json.loads(blob)

    def put(self, table: str, key: Tuple, obj: Any) -> None:
        self.conn.execute(
            f"""REPLACE INTO {table}(key1, key2, json, ts)
                VALUES (?, ?, ?, ?)""",
            (*key, json.dumps(obj), int(time.time())),
        )
        self.conn.commit()

    # ---------- schema ---------- #
    def _init_schema(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS course_reviews (
                key1 TEXT,          -- course
                key2 TEXT,          -- professor or ''
                json TEXT NOT NULL,
                ts   INTEGER NOT NULL,
                PRIMARY KEY (key1, key2)
            );

            CREATE TABLE IF NOT EXISTS course_grades (
                key1 TEXT,
                key2 TEXT,
                json TEXT NOT NULL,
                ts   INTEGER NOT NULL,
                PRIMARY KEY (key1, key2)
            );

            CREATE TABLE IF NOT EXISTS prof_ratings (
                key1 TEXT,          -- professor
                key2 TEXT DEFAULT '',  -- unused
                json TEXT NOT NULL,
                ts   INTEGER NOT NULL,
                PRIMARY KEY (key1, key2)
            );

            CREATE TABLE IF NOT EXISTS prof_grades (
                key1 TEXT,
                key2 TEXT DEFAULT '',
                json TEXT NOT NULL,
                ts   INTEGER NOT NULL,
                PRIMARY KEY (key1, key2)
            );
            """
        )


class PlanetTerpCacheWrapper:
    """Light shim around the API that adds caching."""

    def __init__(self) -> None:
        self.db = _SQLCache()

    # ---------- course-centric ---------- #
    def grades(self, course: str, professor: Optional[str]) -> Dict:
        key = (course.upper(), professor or "")
        cached = self.db.get("course_grades", key)
        cached = False
        if cached:
            return cached

        data = planetterp.grades(course=course, professor=professor)
        grades, gpa = utils.aggregate_grade_data(data)
        grades["gpa"] = gpa
        self.db.put("course_grades", key, grades)
        return grades

    async def course(self, name: str, professorName: str) -> Dict:
        key = (name.upper(), professorName.lower())
        cached = self.db.get("course_reviews", key)
        cached = False
        if cached:
            return cached

        data = planetterp.course(name=name, reviews=True)
        prof_lower = professorName.lower()
        # keep only reviews whose `reviewer` matches professor
        reviews = [
            r for r in data.get("reviews", []) if prof_lower in r["professor"].lower()
        ]
        result = {}
        result["summarized"] = await utils.split_and_summarize_reviews(reviews)
        self.db.put("course_reviews", key, result)
        return result  

    # ---------- professor-centric ---------- #
    async def professor(self, name: str, reviews: bool) -> Dict:
        key = (name.lower(), "")
        cached = self.db.get("prof_ratings", key)
        cached = False
        if cached and reviews:
            return cached

        data = planetterp.professor(name=name, reviews=reviews)
        result = {"average_rating": data["average_rating"]}
        if reviews:
            result["summarized"] = await utils.split_and_summarize_reviews(data["reviews"])

        self.db.put("prof_ratings", key, result)
        return result

    def professor_grades(self, name: str) -> Dict:
        key = (name.lower(), "")
        cached = self.db.get("prof_grades", key)
        cached = False
        if cached:
            return cached

        data = planetterp.grades(professor=name)
        grades, gpa = utils.aggregate_grade_data(data)
        print(grades, gpa)
        grades["gpa"] = gpa
        self.db.put("prof_grades", key, grades)
        return grades


class PlanetTerpFetcher:
    def __init__(self) -> None:
        self.fetcher = PlanetTerpCacheWrapper()

    # ---------- class API ---------- #
    async def getClassReviews(
        self, className: str, professorName: str
    ) -> Dict:
        """Return course info (and reviews). Optionally filter to reviews for one professor."""
        return await self.fetcher.course(name=className, professorName=professorName)

    def getClassGrades(
        self, className: str, professorName: Optional[str] = None
    ) -> Dict:
        """Return grade distribution for a course, possibly narrowed to one professor."""
        return self.fetcher.grades(course=className, professor=professorName)

    # ---------- professor API ---------- #
    async def getProfessorRatings(self, professorName: str, reviews: bool) -> Dict:
        """Return professor metadata (includes `average_rating`, `difficulty`, etc.)."""
        return await self.fetcher.professor(name=professorName, reviews=reviews)

    def getProfessorGrades(self, professorName: str) -> Dict:
        """Return all grade distributions for courses taught by `professorName`."""
        return self.fetcher.professor_grades(professorName)



# ------------------ demo ------------------ #
if __name__ == "__main__":
    fetcher = PlanetTerpFetcher()
    print(fetcher.getClassGrades("CMSC132")[10])
    #print(fetcher.getClassReviews("CMSC132", professorName="Larry Herman"))
    #print(fetcher.getProfessorRatings("Larry Herman"))
    #print(fetcher.getProfessorGrades("Larry Herman"))
