from pydantic import ValidationError
from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from aws_lambda_powertools.utilities.typing import LambdaContext

from .models import ApplicationCreate, ApplicationUpdate
from . import repository

app = APIGatewayRestResolver()
logger = Logger(service="applications")


@app.exception_handler(ValidationError)
def handle_validation_error(ex: ValidationError):
    # pydantic raises ValidationError when the request body doesn't match
    # ApplicationCreate/ApplicationUpdate — without this handler, Powertools
    # would let it propagate as an unhandled 500. Converting it to a
    # BadRequestError turns it into a proper 400 with the validation detail.
    logger.warning("Request body failed validation", extra={"error": str(ex)})
    raise BadRequestError(str(ex))


def _current_user_id() -> str:
    """API Gateway's CognitoUserPoolsAuthorizer has already validated the
    JWT before this Lambda ever runs. `sub` is a stable, immutable UUID
    Cognito assigns per user — the right value to scope data by, unlike
    `username` (which, per this User Pool's current sign_in_aliases config,
    is itself just a random id, not the email — see Docs/Planning.md)."""
    claims = app.current_event.request_context.authorizer.claims
    return claims["sub"]


@app.get("/applications")
def list_applications():
    user_id = _current_user_id()
    logger.info("Listing applications", extra={"user_id": user_id})
    applications = repository.list_applications(user_id)
    # mode="json" turns `date` fields into ISO strings — plain model_dump()
    # would leave them as Python `date` objects, which the JSON response
    # serializer doesn't know how to encode.
    return [a.model_dump(mode = "json", by_alias = True) for a in applications]


@app.post("/applications")
def create_application():
    user_id = _current_user_id()
    data = ApplicationCreate.model_validate(app.current_event.json_body)
    created = repository.create_application(user_id, data)
    logger.info(
        "Created application",
        extra={"user_id": user_id, "application_id": created.application_id},
    )
    return created.model_dump(mode = "json", by_alias = True)


@app.get("/applications/<application_id>")
def get_application(application_id: str):
    user_id = _current_user_id()
    application = repository.get_application(user_id, application_id)
    if not application:
        logger.info(
            "Application not found",
            extra={"user_id": user_id, "application_id": application_id},
        )
        raise NotFoundError()
    return application.model_dump(mode = "json", by_alias = True)


@app.put("/applications/<application_id>")
def update_application(application_id: str):
    user_id = _current_user_id()
    data = ApplicationUpdate.model_validate(app.current_event.json_body)
    application = repository.update_application (user_id, application_id, data)
    if not application:
        logger.info(
            "Application not found for update",
            extra={"user_id": user_id, "application_id": application_id},
        )
        raise NotFoundError()
    logger.info(
        "Updated application",
        extra={"user_id": user_id, "application_id": application_id},
    )
    return application.model_dump(mode = "json", by_alias = True)


@app.delete("/applications/<application_id>")
def delete_application(application_id: str):
    user_id = _current_user_id()
    deleted = repository.delete_application(user_id, application_id)
    if not deleted:
        logger.warning(
            "Application not found for delete",
            extra={"user_id": user_id, "application_id": application_id},
        )
        raise NotFoundError()
    logger.info(
        "Deleted application",
        extra={"user_id": user_id, "application_id": application_id},
    )
    return {}


@logger.inject_lambda_context(log_event=True)
def handler(event, context: LambdaContext):
    return app.resolve(event, context)
