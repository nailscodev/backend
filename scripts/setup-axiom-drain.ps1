# Setup Axiom Log Drains for Fly.io apps
#
# Required environment variables (set before running this script):
#   $env:FLY_API_TOKEN   - Fly.io API token  (run: flyctl auth token)
#   $env:AXIOM_TOKEN     - Axiom ingest token (Axiom > Settings > API Tokens)
#   $env:AXIOM_DATASET   - Axiom dataset name (default: nailsco-logs)
#
# Usage:
#   $env:FLY_API_TOKEN = "FlyV1 ..."
#   $env:AXIOM_TOKEN   = "xaat-..."
#   .\setup-axiom-drain.ps1

param(
    [string]$FLY_TOKEN    = $env:FLY_API_TOKEN,
    [string]$AXIOM_TOKEN  = $env:AXIOM_TOKEN,
    [string]$AXIOM_DATASET = if ($env:AXIOM_DATASET) { $env:AXIOM_DATASET } else { "nailsco-logs" }
)

if (-not $FLY_TOKEN)   { Write-Error "FLY_API_TOKEN is not set. Run: flyctl auth token"; exit 1 }
if (-not $AXIOM_TOKEN) { Write-Error "AXIOM_TOKEN is not set. Get it from Axiom > Settings > API Tokens"; exit 1 }

$AXIOM_URL = "https://api.axiom.co/v1/datasets/$AXIOM_DATASET/ingest"

$headers = @{
    "Authorization" = $FLY_TOKEN
    "Content-Type"  = "application/json"
}

# Get org slug first
$orgQuery = '{ "query": "{ currentUser { organizations { nodes { slug } } } }" }'
$orgResult = Invoke-RestMethod -Uri "https://api.fly.io/graphql" -Headers $headers -Method Post -Body $orgQuery
Write-Host "Org slug:" ($orgResult.data.currentUser.organizations.nodes[0].slug)

# Create log drain for backend
$backendMutation = @{
    query = 'mutation { createLogDrain(input: { appId: "nailsco-backend", name: "axiom-nailsco", destination: "' + $AXIOM_URL + '", token: "' + $AXIOM_TOKEN + '" }) { logDrain { id name destination } } }'
} | ConvertTo-Json

Write-Host "`n==> Creating log drain for nailsco-backend..."
$result = Invoke-RestMethod -Uri "https://api.fly.io/graphql" -Headers $headers -Method Post -Body $backendMutation
$result | ConvertTo-Json -Depth 5

# Create log drain for frontend
$frontendMutation = @{
    query = 'mutation { createLogDrain(input: { appId: "nailsco-frontend", name: "axiom-nailsco", destination: "' + $AXIOM_URL + '", token: "' + $AXIOM_TOKEN + '" }) { logDrain { id name destination } } }'
} | ConvertTo-Json

Write-Host "`n==> Creating log drain for nailsco-frontend..."
$result2 = Invoke-RestMethod -Uri "https://api.fly.io/graphql" -Headers $headers -Method Post -Body $frontendMutation
$result2 | ConvertTo-Json -Depth 5
