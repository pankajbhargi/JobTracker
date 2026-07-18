import uuid
from typing import Optional
from .db import get_connection
from .models import ApplicationCreate, ApplicationUpdate, ApplicationResponse


def list_applications(user_id: str) -> list[ApplicationResponse]:
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM applications WHERE user_id = %s ORDER BY applied_date DESC",
            (user_id,),
        )
        rows = cursor.fetchall()
    # DictCursor rows already use snake_case column names matching our
    # model's field names, so populate_by_name (set on ApiModel) lets this
    # construct directly without any manual field mapping.
    return [ApplicationResponse(**row) for row in rows]


def create_application(user_id: str, data: ApplicationCreate) -> ApplicationResponse:
    application_id = str(uuid.uuid4())
    status = "applied"  # every new application starts here — same rule the
    # mock ApplicationsService.createApplication() already uses in Angular.

    connection = get_connection()
    with connection.cursor() as cursor:
        # %s placeholders — PyMySQL parameterizes these safely. Never
        # f-string/format user-supplied values directly into SQL.
        cursor.execute(
            """
            INSERT INTO applications
                (application_id, user_id, company, position, job_description,
                 status, applied_date, follow_up_date, resume_version_id, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                application_id,
                user_id,
                data.company,
                data.position,
                data.job_description,
                status,
                data.applied_date,
                data.follow_up_date,
                data.resume_version_id,
                data.notes,
            ),
        )

    # Built directly from what we already know, rather than a second SELECT
    # round-trip — we generated application_id/status ourselves and already
    # have every other field on `data`.
    return ApplicationResponse(
        application_id=application_id,
        user_id=user_id,
        status=status,
        **data.model_dump(),
    )


def get_application(user_id: str, application_id: str) -> Optional[ApplicationResponse]:
    # TODO: fetch a single application scoped to BOTH application_id and
    # user_id (never trust application_id alone — another user could guess
    # an id otherwise). Hint: same connection/cursor pattern as
    # list_applications above, but:
    #   cursor.execute(
    #       "SELECT * FROM applications WHERE application_id = %s AND user_id = %s",
    #       (application_id, user_id),
    #   )
    #   row = cursor.fetchone()
    # Return None if no row was found (the handler turns that into a 404) —
    # otherwise ApplicationResponse(**row), same as list_applications.
    raise NotImplementedError


def update_application(
    user_id: str, application_id: str, data: ApplicationUpdate
) -> Optional[ApplicationResponse]:
    # TODO: UPDATE status/job_description/notes/resume_version_id for the
    # row matching application_id AND user_id — same %s-placeholder
    # parameterization as create_application above. After the UPDATE,
    # call get_application(user_id, application_id) (once you've implemented
    # it) to return the fresh row — it'll also naturally return None if
    # nothing matched, which the handler turns into a 404.
    raise NotImplementedError


def delete_application(user_id: str, application_id: str) -> bool:
    # TODO: DELETE the row matching application_id AND user_id. Return True
    # if a row was actually deleted, False if nothing matched. Hint: after
    # cursor.execute(...), the cursor's `.rowcount` attribute tells you how
    # many rows were affected.
    raise NotImplementedError
