// IMPORTANT: after you deploy the backend platform to GCP, update this value
// to the API Gateway's public address (the Load Balancer's HTTPS hostname,
// e.g. "https://34.49.80.185.nip.io" - see deployment/GCP_CLI_DEPLOYMENT_GUIDE.md
// Part 12). Redeploy the frontend to Cloud Run after changing this.
const API_BASE_URL = "http://REPLACE_WITH_YOUR_LOAD_BALANCER_HOSTNAME";
