# Job Application Tracker — Roadmap

Portfolio project demonstrating AWS Developer Associate skills (Angular → API Gateway → Lambda → RDS/S3/DynamoDB, Cognito auth, CDK IaC), extended with a set of AI features (Amazon Bedrock) to learn RAG/embeddings, prompt engineering, structured extraction, agentic reasoning, and AI-specific security practices.

Supersedes the phase list in `Planning.docx` (kept as a historical snapshot). See `01_Vision_and_Requirements.docx` and `02_Solution_Architecture.docx` / `Job_Application_Tracker_Detailed_Design.docx` for the original vision and architecture.

## Phase 1 — Cloud Foundations *(~95% done)*
- ✅ CDK infrastructure
- ✅ Cognito (deployed: User Pool `us-east-1_yYCMzYeEv`, client `40lpfhpaani64egiqq6slf0765`, region `us-east-1`)
- 🚧 RDS — finish/verify deployment

## Phase 2 — Angular Application *(in progress — current focus)*
- Cognito authentication via `aws-amplify` (Amplify config, `AuthService` wrapper, real Login/Register forms with Reactive Forms + Material, email-verification step)
- Route guards (functional `authGuard`, protects dashboard/applications/profile)
- HTTP interceptor attaching the Cognito ID token as `Authorization: Bearer` (prep for Phase 3)
- Header: show signed-in user + logout action
- `core/models`: `Application`, `ActivityEvent`, `ResumeVersion` TS interfaces
- Dashboard, Applications, Profile: flesh out from empty shells into real UI backed by mock `ApplicationsService`/`ResumesService` (swappable for real HTTP in Phase 3)
- Profile: resume library with versioning (`ResumeVersion`s can be `manual` or `ai_generated`, one marked default, `changeNotes` free-text field for provenance), plus editable Name (persisted via Cognito's `updateUserAttributes`, real persistence today — no backend needed for this part)
- **AI hook**: "Auto-fill from job posting" button/textarea on the new-application form (UI + service stub now; wired to a real Lambda in Phase 3)
- Resume picker on Applications: pick a `ResumeVersion` (defaulting to whichever is marked `isDefault`) on the New Application form, view/change it on the Application Detail page (with a Download link) ✅

## Phase 3 — Backend Core (Lambda + API Gateway + S3)
- Python Lambda APIs: CRUD for Applications (pydantic models, `aws_lambda_powertools`, PyMySQL → RDS)
- Resume uploads via S3 (pre-signed URL endpoint): `resume_key` stored on `ResumeVersion` (not `Application` — `Application.resumeVersionId` just references which version was used), replacing the Phase 2 blob-URL stand-in in `ResumesService`
- API Gateway routes: `GET/POST /applications`, `GET/PUT/DELETE /applications/{id}`, `POST /applications/{id}/upload`
- Connect Angular services to the real backend (swap out Phase 2's mock service)
- **AI task**: *auto-fill from job posting* — Lambda calling Bedrock (Claude, structured JSON output validated with pydantic) to extract company/position/requirements from pasted text
- Bedrock access setup — enable model access, scoped least-privilege IAM role (`bedrock:InvokeModel` restricted to the specific model ARN) for AI-calling Lambdas

## Phase 4 — Async & Observability
- SNS notifications, CloudWatch monitoring, DynamoDB activity log
- **AI task**: *smart follow-up nudges* — EventBridge-scheduled Lambda reads `ActivityEvent` history per application, uses Bedrock to reason about stale applications, drafts a follow-up suggestion, delivers via SNS

## Phase 5 — AI Features Deep-Dive
- *Resume-to-JD match scoring*: extract resume text from S3, embed resume + job description via Bedrock Titan Embeddings, cosine-similarity score, Claude explains the gaps; new API endpoint + Angular results view
- *AI-tailored suggestions*: prompt Claude with resume + JD to produce tailored bullet-point suggestions / a cover-letter draft; explore streaming the response to Angular
- *Security hardening*: input sanitization / prompt-injection guardrails on any pasted JD or resume text before it reaches a model call; review scoped IAM and Secrets Manager usage across all AI Lambdas

## Phase 6 — Polish & Demo
- Analytics page: flesh out from empty shell into real UI (charts/insights over `Application`/`ActivityEvent` data), guarded the same way as the other Phase 2 pages
- Frontend + backend tests, README/demo docs, architecture diagram refresh, portfolio write-up covering both the AWS and AI skills demonstrated
