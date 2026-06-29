# Update mechanism for Nail Studio (Docker deployment) — Windows
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Fetching latest changes..."
$branch = git rev-parse --abbrev-ref HEAD
git fetch origin $branch

$local = git rev-parse HEAD
$remote = git rev-parse "origin/$branch"

if ($local -eq $remote) {
    Write-Host "==> Already up to date ($local)."
    exit 0
}

Write-Host "==> Updating $local -> $remote"
git pull --ff-only origin $branch

Write-Host "==> Rebuilding and restarting containers..."
docker compose pull
docker compose up -d --build

Write-Host "==> Pruning old images..."
docker image prune -f | Out-Null

Write-Host "==> Update complete. Migrations run automatically on backend start."
