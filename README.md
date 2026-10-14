
---

## Frontend Development, GitHub and Integration

### 1. Frontend Pages

The PROE frontend includes the following pages:

- **Home:** Project introduction, navigation, research overview, and sample research cards.
- **Papers:** Research paper listing interface with search and API error handling.
- **Login:** Login form with frontend validation.
- **Register:** Registration form with required-field and password confirmation validation.
- **Submit Research:** Form for submitting research papers to the backend API.

### 2. Frontend Features

- Responsive layout for desktop and mobile screens.
- Mobile navigation menu with open and close functionality.
- Light and dark theme toggle.
- Homepage search for sample research cards.
- Topic shortcuts for filtering sample papers.
- Form validation and user feedback.
- Graceful handling of unavailable API responses.

### 3. GitHub Workflow

- Project branch: `develop`
- Frontend changes are committed and pushed to the GitHub repository.
- Frontend changes are kept separate from unrelated backend source changes.

### 4. Integration and Testing

The frontend was tested with the existing Spring Boot service.

- Health endpoint: `GET /api/health` returned HTTP 200 during testing.
- Research submission: The frontend displayed a successful submission message during testing.
- Papers listing: `GET /api/papers` returned HTTP 405 during testing, with `POST` listed as the allowed method.
- Login and registration: Frontend form validation was tested.
- Responsive layout, navigation, theme toggle, and homepage search were tested.

### 5. Pending Integration Dependency

The Papers page requires an API endpoint that returns a list of research papers. The backend team must confirm or provide the appropriate GET endpoint and its response format before the frontend can display live research paper data.

### 6. Scope of Responsibility

This work covers frontend development, GitHub workflow, frontend testing, and integration with available backend APIs. Backend implementation, database development, Node.js/Express services, CI/CD, and deployment are handled separately by the responsible team members.
