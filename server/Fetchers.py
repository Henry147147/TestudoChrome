from abc import ABC, abstractmethod
import planetterp as terp
from typing import Optional

class Fetcher(ABC):
    @abstractmethod
    def getClassReviews(self, className: str, professorName: Optional[str] = None):
        """Gets reviews for a class, optionally filtered by professor"""
        pass

    @abstractmethod
    def getClassGrades(self, className: str, professorName: Optional[str] = None):
        """Gets grades for a class, optionally filtered by professor"""
        pass

    @abstractmethod
    def getProfessorRatings(self, professorName: str):
        """Gets professor ratings"""
        pass

    @abstractmethod
    def getProfessorGrades(self, professorName: str):
        """Gets professor grades"""
        pass


class PlanetTerpFetcher(Fetcher):
    def getClassReviews(self, className: str, professorName: Optional[str] = None):
        """Gets reviews for a class, optionally filtered by professor"""
        if professorName is None:
            reviews = terp.course(name=className, reviews=True)
        else:
            reviews = terp.course(name=className, reviews=True)
        print(reviews)
        return reviews

    def getClassGrades(self, className: str, professorName: Optional[str] = None):
        """Gets grades for a class, optionally filtered by professor"""
        # Replace the following with actual logic
        print(f"Getting grades for {className} with professor {professorName}")
        return {}

    def getProfessorRatings(self, professorName: str):
        """Gets professor ratings"""
        print(f"Getting ratings for professor {professorName}")
        return {}

    def getProfessorGrades(self, professorName: str):
        """Gets professor grades"""
        print(f"Getting grades for professor {professorName}")
        return {}


class RateMyProfessorFetcher(Fetcher):
    BASE_URL = ""

    def getClassReviews(self, className: str, professorName: Optional[str] = None):
        """Gets reviews for a class, optionally filtered by professor"""
        print(f"Fetching reviews from RateMyProfessor for {className}, professor: {professorName}")
        return {}

    def getClassGrades(self, className: str, professorName: Optional[str] = None):
        """Gets grades for a class, optionally filtered by professor"""
        print(f"Fetching grades from RateMyProfessor for {className}, professor: {professorName}")
        return {}

    def getProfessorRatings(self, professorName: str):
        """Gets professor ratings"""
        print(f"Fetching ratings from RateMyProfessor for professor {professorName}")
        return {}

    def getProfessorGrades(self, professorName: str):
        """Gets professor grades"""
        print(f"Fetching grades from RateMyProfessor for professor {professorName}")
        return {}
