import pytest
import requests

pytestmark = pytest.mark.integration


class TestCreateApplication:
    def test_create_application_returns_created_record(self, api_base_url, id_token):
        payload = {
            "company": "Acme Corp",
            "position": "Backend Engineer",
            "jobDescription": "Building and maintaining backend services in AWS.",
            "appliedDate": "2026-07-22",
            "followUpDate": "2026-07-29",
            "resumeVersionId": "resume-v1",
            "notes": "Referred by a former colleague.",
        }
        headers = {"Authorization": id_token}

        response = requests.post(f"{api_base_url}/applications", json=payload, headers=headers, timeout=10)

        try:
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["applicationId"]
            assert body["userId"]
            assert body["status"] == "applied"
            assert body["company"] == payload["company"]
            assert body["position"] == payload["position"]
            assert body["jobDescription"] == payload["jobDescription"]
            assert body["appliedDate"] == payload["appliedDate"]
            assert body["followUpDate"] == payload["followUpDate"]
            assert body["resumeVersionId"] == payload["resumeVersionId"]
            assert body["notes"] == payload["notes"]
        finally:
            # Real DB, real row — clean up so repeated runs don't pile up test data.
            if response.status_code == 200:
                requests.delete(f"{api_base_url}/applications/{body['applicationId']}", headers=headers, timeout=10)
