from pydantic import ValidationError
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from aws_lambda_powertools.utilities.typing import LambdaContext

from .models import ApplicationCreate, ApplicationUpdate
from . import repository

app = APIGatewayRestResolver()


@app.exception_handler(ValidationError)
def handle_validation_error(ex: ValidationError):
    # pydantic raises ValidationError when the request body doesn't match
    # ApplicationCreate/ApplicationUpdate — without this handler, Powertools
    # would let it propagate as an unhandled 500. Converting it to a
    # BadRequestError turns it into a proper 400 with the validation detail.
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
    applications = repository.list_applications(user_id)
    # mode="json" turns `date` fields into ISO strings — plain model_dump()
    # would leave them as Python `date` objects, which the JSON response
    # serializer doesn't know how to encode.
    return [a.model_dump(mode="json", by_alias=True) for a in applications]


@app.post("/applications")
def create_application():
    user_id = _current_user_id()
    data = ApplicationCreate.model_validate(app.current_event.json_body)
    created = repository.create_application(user_id, data)
    return created.model_dump(mode="json", by_alias=True)


@app.get("/applications/<application_id>")
def get_application(application_id: str):
    # TODO: user_id = _current_user_id(); application =
    # repository.get_application(user_id, application_id) (once you've
    # implemented that in repository.py). If `application` is None, `raise
    # NotFoundError()` (imported above) — Powertools turns that into a 404.
    # Otherwise return application.model_dump(mode="json", by_alias=True),
    # same pattern as list_applications/create_application above.
    raise NotImplementedError


@app.put("/applications/<application_id>")
def update_application(application_id: str):
    # TODO: user_id = _current_user_id(); data =
    # ApplicationUpdate.model_validate(app.current_event.json_body);
    # application = repository.update_application(user_id, application_id,
    # data). Raise NotFoundError() if it's None, otherwise return
    # application.model_dump(mode="json", by_alias=True).
    raise NotImplementedError


@app.delete("/applications/<application_id>")
def delete_application(application_id: str):
    # TODO: user_id = _current_user_id(); deleted =
    # repository.delete_application(user_id, application_id). Raise
    # NotFoundError() if `deleted` is False. Otherwise return an empty
    # response, e.g. `return {}`.
    raise NotImplementedError


def handler(event, context: LambdaContext):
    return app.resolve(event, context)
