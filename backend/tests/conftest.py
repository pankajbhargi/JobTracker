import pytest


class DummyLambdaContext:
    """Minimal stand-in for the real LambdaContext AWS passes in — only the
    attributes Powertools' Logger/inject_lambda_context actually reads."""

    aws_request_id = "test-request-id"
    function_name = "test-applications-function"
    memory_limit_in_mb = 256
    invoked_function_arn = (
        "arn:aws:lambda:us-east-1:123456789012:function:test-applications-function"
    )
    log_stream_name = "test-log-stream"

    def get_remaining_time_in_millis(self) -> int:
        return 30000


@pytest.fixture
def lambda_context() -> DummyLambdaContext:
    return DummyLambdaContext()


def _build_event(
    method: str,
    path: str,
    *,
    body: str | None = None,
    path_params: dict | None = None,
    user_id: str = "test-user-sub",
) -> dict:
    """Builds a minimal API Gateway REST API proxy-integration event.

    Powertools' APIGatewayRestResolver routes using `httpMethod` + `path`
    (matching them against the `<param>` templates registered via
    @app.get/@app.post/etc.) rather than relying on `pathParameters` for
    dynamic segments, so `path` must be the real, full request path (e.g.
    "/applications/app-1"), not the API Gateway resource template.

    `requestContext.authorizer.claims` simulates what API Gateway's
    CognitoUserPoolsAuthorizer injects *after* validating the JWT — real
    API Gateway does that validation before the Lambda ever runs, so tests
    never need a real token.
    """
    return {
        "httpMethod": method,
        "path": path,
        "resource": path,
        "pathParameters": path_params,
        "headers": {"Content-Type": "application/json"},
        "multiValueHeaders": {},
        "queryStringParameters": None,
        "multiValueQueryStringParameters": None,
        "body": body,
        "isBase64Encoded": False,
        "requestContext": {
            "authorizer": {"claims": {"sub": user_id}},
        },
    }


@pytest.fixture
def make_api_event():
    return _build_event
