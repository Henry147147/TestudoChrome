from abc import ABC, abstractmethod
from typing import Union, List


class Fetcher(ABC):
    @abstractmethod
    def getClassReviews(self, className: str):
        """Gets reviews for a class, regardless of professor"""
        pass

    @abstractmethod
    def getClassReviews(self, className: str, professorName: str):
        """Gets reviews for a class and a specific professor"""
        pass

    @abstractmethod
    def getClassGrades(self, className: str):
        """Gets grades for a class, regardless of professor"""
        pass

    @abstractmethod
    def getClassGrades(self, className: str, professorName: str):
        """Gets grades for a class for a specific professor"""
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
    BASE_URL = ""
    pass

class RateMyProfessorFetcher(Fetcher):
    BASE_URL = ""
    pass
