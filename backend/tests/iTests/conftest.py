import os

import boto3
import pytest


@pytest.fixture(scope="session")
def api_base_url() -> str:
    """Base URL of the deployed API, e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/prod
    (the ApplicationsApiEndpoint CFN output). Skips the whole session if unset, so a plain
    `pytest` run doesn't fail just because no live stack is configured."""
    url = os.environ.get("JOB_TRACKER_API_URL")
    if not url:
        pytest.skip("JOB_TRACKER_API_URL not set — skipping integration tests against the live API")
    return url.rstrip("/")


@pytest.fixture(scope="session")
def id_token() -> str:
    """Cognito ID token for a real, confirmed user, fetched via USER_PASSWORD_AUTH —
    the same flow the app client allows (see infra/cdk/cdk/constructs/authentication.py)."""
    client_id = os.environ.get("JOB_TRACKER_COGNITO_CLIENT_ID")
    username = os.environ.get("JOB_TRACKER_TEST_USERNAME")
    password = os.environ.get("JOB_TRACKER_TEST_PASSWORD")
    if not all([client_id, username, password]):
        pytest.skip(
            "JOB_TRACKER_COGNITO_CLIENT_ID / JOB_TRACKER_TEST_USERNAME / "
            "JOB_TRACKER_TEST_PASSWORD not set — skipping integration tests against the live API"
        )

    cognito = boto3.client("cognito-idp", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    response = cognito.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        ClientId=client_id,
        AuthParameters={"USERNAME": username, "PASSWORD": password},
    )
    return response["AuthenticationResult"]["IdToken"]
