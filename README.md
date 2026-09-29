# PulseFit — Frontend Web Application

## Project Description

A plain HTML/CSS/JavaScript single-page app for PulseFit — a gym and
fitness-class booking platform. It talks only to the API Gateway (never
directly to a microservice), with three tabs:

- **Members** — add/list/delete gym members, upload a profile photo (stored
  in a Cloud Storage bucket via `member-service`)
- **Classes** — add/list/delete fitness classes (via `class-service`)
- **Bookings** — book a member into a class, cancel or delete a booking (via
  `booking-service`, which itself calls `member-service` and `class-service`
  to validate the booking)

This demonstrates that every backend microservice is reachable and working
through the API Gateway. Per the module guidelines, UI polish is not the
point here — the goal is only to prove the backend works end to end.

## Technology Stack

- Plain HTML5, CSS3, vanilla JavaScript (no build step, no framework)
- Served in production by `nginx:alpine` inside a small Docker image
- Deployed to **Google Cloud Run** (PaaS/Serverless, per the module's
  deployment-model requirement)
- Optional GitHub Actions workflow (`.github/workflows/deploy-cloudrun.yml`)
  using Workload Identity Federation for keyless CI/CD

## Setup / Getting Started

### Configure the backend address

Edit `config.js` and set `API_BASE_URL` to your deployed API Gateway's
public HTTPS address (the Load Balancer hostname from
`deployment/GCP_CLI_DEPLOYMENT_GUIDE.md`, Part 12), for example:

```js
const API_BASE_URL = "https://34.49.80.185.nip.io";
```

### Run locally

Any static file server works, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Run the production image locally

```bash
docker build -t pulsefit-frontend .
docker run -p 8080:8080 pulsefit-frontend
```

### Deploy to Cloud Run

See `deployment/GCP_CLI_DEPLOYMENT_GUIDE.md` (Part 13) in the workspace
root for the full `gcloud builds submit` / `gcloud run deploy` walkthrough.

## Repository "About" section

Per the module's documentation requirement, once this is deployed, set this
repo's GitHub "About" description to include the **live Cloud Run URL**.

## Student Information

- **Student Name:** Pasan Nimila
- **Student Number:** 2301692034
- **Slack Handle:** pasan_nimila (optional)
- **GCP Project ID:** pulsefit-capstone
