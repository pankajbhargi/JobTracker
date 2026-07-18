from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Base for every model this API exposes. alias_generator=to_camel makes
    JSON on the wire use camelCase (applicationId, jobDescription, ...) —
    matching the Angular `Application` interface exactly, so the eventual
    swap from mock ApplicationsService to real HttpClient calls needs zero
    field-name mapping. populate_by_name still allows constructing instances
    from Python using the snake_case attribute names (e.g. from a DB row)."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ApplicationCreate(ApiModel):
    company: str
    position: str
    job_description: str
    applied_date: date
    follow_up_date: Optional[date] = None
    resume_version_id: Optional[str] = None
    notes: Optional[str] = None


class ApplicationUpdate(ApiModel):
    status: str
    job_description: str
    notes: Optional[str] = None
    resume_version_id: Optional[str] = None


class ApplicationResponse(ApiModel):
    application_id: str
    user_id: str
    company: str
    position: str
    job_description: str
    status: str
    applied_date: date
    follow_up_date: Optional[date] = None
    resume_version_id: Optional[str] = None
    notes: Optional[str] = None
