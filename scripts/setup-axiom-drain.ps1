$FLY_TOKEN = "FlyV1 fm2_lJPECAAAAAAAESOixBApDj4jUC1ExUMRMpC7WTU4wrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOABYdbh8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDzI3OW+2V89qFqUY60ZhNpKYsZc71bn3fxr7ZIep1AZbzGY3MwnNab8Edbkg/W7knMCBErBlxpcarTWEODETrbsmFSPko+A2dLIOp0xivAL0+zNFgZSUq3l21eoykmqDT3vKu8QxPC6D3cVEHca1A6BOl+6Ke3qLAQV9lPDFH05M6x6JzROUwW4M6PFqA2SlAORgc4AzMCjHwWRgqdidWlsZGVyH6J3Zx8BxCAnML8gsB110d6pwzlMspbFpGi2GWO9PtupsC0mkpCZAA=="

$AXIOM_TOKEN = "xaat-ca8aea5e-2270-4622-826b-c88ba5cab6fe"
$AXIOM_DATASET = "nailsco-logs"
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
