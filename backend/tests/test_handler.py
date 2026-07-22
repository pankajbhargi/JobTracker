import json

from applications.job_tracker import handler
from applications.job_tracker.models import ApplicationResponse

EXPECTED_RESPONSE_JSON = {
    "applicationId": "app-1",
    "userId": "test-user-sub",
    "company": "Acme Corp",
    "position": "Senior Engineer",
    "jobDescription": "Build things",
    "status": "applied",
    "appliedDate": "2026-07-01",
    "followUpDate": None,
    "resumeVersionId": None,
    "notes": None,
}


def make_response_model(**overrides) -> ApplicationResponse:
    data = {
        "application_id": "app-1",
        "user_id": "test-user-sub",
        "company": "Acme Corp",
        "position": "Senior Engineer",
        "job_description": "Build things",
        "status": "applied",
        "applied_date": "2026-07-01",
    }
    data.update(overrides)
    return ApplicationResponse(**data)


class TestListApplications:
    def test_returns_applications_for_current_user(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(
            handler.repository,
            "list_applications",
            lambda user_id: [make_response_model()],
        )
        event = make_api_event("GET", "/applications")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200
        assert json.loads(response["body"]) == [EXPECTED_RESPONSE_JSON]

    def test_returns_empty_list_when_no_applications(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(handler.repository, "list_applications", lambda user_id: [])
        event = make_api_event("GET", "/applications")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200
        assert json.loads(response["body"]) == []


class TestCreateApplication:
    def test_creates_and_returns_application(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(
            handler.repository,
            "create_application",
            lambda user_id, data: make_response_model(),
        )
        event = make_api_event(
            "POST",
            "/applications",
            body=json.dumps(
                {
                    "company": "Acme Corp",
                    "position": "Senior Engineer",
                    "jobDescription": "Build things",
                    "appliedDate": "2026-07-01",
                }
            ),
        )

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200
        assert json.loads(response["body"]) == EXPECTED_RESPONSE_JSON

    def test_rejects_invalid_body_with_400(self, lambda_context, make_api_event):
        # Missing required fields (position, jobDescription, appliedDate) —
        # exercises the ValidationError -> BadRequestError exception handler.
        event = make_api_event("POST", "/applications", body=json.dumps({"company": "Acme"}))

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 400


class TestGetApplication:
    def test_returns_application_when_found(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(
            handler.repository,
            "get_application",
            lambda user_id, application_id: make_response_model(),
        )
        event = make_api_event("GET", "/applications/app-1")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200
        assert json.loads(response["body"]) == EXPECTED_RESPONSE_JSON

    def test_returns_404_when_not_found(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(handler.repository, "get_application", lambda user_id, application_id: None)
        event = make_api_event("GET", "/applications/missing")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 404


class TestUpdateApplication:
    def test_updates_and_returns_application(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(
            handler.repository,
            "update_application",
            lambda user_id, application_id, data: make_response_model(status="interviewing"),
        )
        event = make_api_event(
            "PUT",
            "/applications/app-1",
            body=json.dumps({"status": "interviewing", "jobDescription": "Build things"}),
        )

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200
        assert json.loads(response["body"])["status"] == "interviewing"

    def test_returns_404_when_not_found(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(
            handler.repository,
            "update_application",
            lambda user_id, application_id, data: None,
        )
        event = make_api_event(
            "PUT",
            "/applications/missing",
            body=json.dumps({"status": "applied", "jobDescription": "x"}),
        )

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 404


class TestDeleteApplication:
    def test_deletes_successfully(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(handler.repository, "delete_application", lambda user_id, application_id: True)
        event = make_api_event("DELETE", "/applications/app-1")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 200

    def test_returns_404_when_not_found(self, monkeypatch, lambda_context, make_api_event):
        monkeypatch.setattr(handler.repository, "delete_application", lambda user_id, application_id: False)
        event = make_api_event("DELETE", "/applications/missing")

        response = handler.handler(event, lambda_context)

        assert response["statusCode"] == 404
