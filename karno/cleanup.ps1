# Karno E-Commerce Platform - Cleanup Script (PowerShell)
# This script implements the recommendations from the codebase cleanup report

Write-Host "Starting Karno codebase cleanup..." -ForegroundColor Green

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "./cleanup_backup_$timestamp"
New-Item -Path $BACKUP_DIR -ItemType Directory -Force | Out-Null
Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Yellow

# Function to backup a file before removing/modifying it
function Backup-File {
    param (
        [string]$FilePath
    )
    
    $backupPath = Join-Path -Path $BACKUP_DIR -ChildPath (Split-Path -Parent $FilePath)
    
    if (-not (Test-Path $backupPath)) {
        New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
    }
    
    if (Test-Path $FilePath) {
        Copy-Item -Path $FilePath -Destination $backupPath -Force
        Write-Host "Backed up: $FilePath" -ForegroundColor Gray
    } else {
        Write-Host "Warning: Could not backup $FilePath (file not found)" -ForegroundColor Yellow
    }
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "1. Removing test routes files" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

# Backup and remove test route files
$TEST_ROUTES = @(
    "backend/src/routes/db-test.routes.js",
    "backend/src/routes/admin/db-test.routes.js",
    "backend/src/routes/admin/payment-test.routes.js"
)

foreach ($file in $TEST_ROUTES) {
    $filePath = $file.Replace("/", "\")
    if (Test-Path $filePath) {
        Backup-File -FilePath $filePath
        Remove-Item -Path $filePath -Force
        Write-Host "Removed: $filePath" -ForegroundColor Green
    } else {
        Write-Host "Warning: $filePath not found" -ForegroundColor Yellow
    }
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "2. Renaming enhanced routes files" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

# Rename product.routes.enhanced.js
$enhancedRoute = "backend\src\routes\product.routes.enhanced.js"
$standardRoute = "backend\src\routes\product.routes.js"

if (Test-Path $enhancedRoute) {
    Backup-File -FilePath $enhancedRoute
    
    # Check if product.routes.js exists
    if (Test-Path $standardRoute) {
        Write-Host "Both product.routes.js and product.routes.enhanced.js exist." -ForegroundColor Yellow
        Write-Host "Please manually review and merge these files." -ForegroundColor Yellow
    } else {
        # Rename enhanced to standard name
        Rename-Item -Path $enhancedRoute -NewName $standardRoute
        Write-Host "Renamed: product.routes.enhanced.js -> product.routes.js" -ForegroundColor Green
    }
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "3. Checking recommendation-monitoring routes" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

$monitoringRoute = "backend\src\routes\recommendation-monitoring.routes.js"
if (Test-Path $monitoringRoute) {
    Backup-File -FilePath $monitoringRoute
    Write-Host "Note: recommendation-monitoring.routes.js found." -ForegroundColor Yellow
    Write-Host "Please review if this is needed in production." -ForegroundColor Yellow
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "4. Updating server.js to remove test route imports" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

$serverJs = "backend\src\server.js"
if (Test-Path $serverJs) {
    Backup-File -FilePath $serverJs
    
    # Read the file content
    $content = Get-Content -Path $serverJs -Raw
    
    # Remove test route imports and usages
    $content = $content -replace "import dbTestRoutes from './routes/db-test.routes.js';`r?`n?", ""
    $content = $content -replace "import adminDbTestRoutes from './routes/admin/db-test.routes.js';`r?`n?", ""
    $content = $content -replace "app.use\('/api/db-test', dbTestRoutes\);`r?`n?", ""
    $content = $content -replace "app.use\('/api/admin/db-test', adminDbTestRoutes\);`r?`n?", ""
    
    # Write the updated content back to the file
    Set-Content -Path $serverJs -Value $content
    Write-Host "Updated: $serverJs (removed test route imports)" -ForegroundColor Green
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "5. Updating admin.routes.js to remove test route imports" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

$adminRoutes = "backend\src\routes\admin.routes.js"
if (Test-Path $adminRoutes) {
    Backup-File -FilePath $adminRoutes
    
    # Read the file content
    $content = Get-Content -Path $adminRoutes -Raw
    
    # Remove test route imports and usages
    $content = $content -replace "import paymentTestRoutes from './admin/payment-test.routes.js';`r?`n?", ""
    $content = $content -replace "router.use\('/payment-test', paymentTestRoutes\);`r?`n?", ""
    
    # Write the updated content back to the file
    Set-Content -Path $adminRoutes -Value $content
    Write-Host "Updated: $adminRoutes (removed test route imports)" -ForegroundColor Green
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "6. Consolidate documentation files" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

# Create docs directory if it doesn't exist
if (-not (Test-Path "docs")) {
    New-Item -Path "docs" -ItemType Directory -Force | Out-Null
}

# Move implementation docs to docs directory
$profileVerificationDoc = "backend\src\PROFILE_VERIFICATION_IMPLEMENTATION.md"
if (Test-Path $profileVerificationDoc) {
    Copy-Item -Path $profileVerificationDoc -Destination "docs\" -Force
    Write-Host "Copied PROFILE_VERIFICATION_IMPLEMENTATION.md to docs\ directory" -ForegroundColor Green
}

$simpleAuthDoc = "backend\src\SIMPLE_AUTH_IMPLEMENTATION.md"
if (Test-Path $simpleAuthDoc) {
    Copy-Item -Path $simpleAuthDoc -Destination "docs\" -Force
    Write-Host "Copied SIMPLE_AUTH_IMPLEMENTATION.md to docs\ directory" -ForegroundColor Green
}

Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "-------------------------------------" -ForegroundColor Cyan

Write-Host "Files backed up to: $BACKUP_DIR" -ForegroundColor Yellow
Write-Host "Please review the following tasks that require manual intervention:" -ForegroundColor Yellow
Write-Host "1. Standardize authentication middleware (authenticate vs. protect)" -ForegroundColor Yellow
Write-Host "2. Clean up User model address storage redundancy" -ForegroundColor Yellow
Write-Host "3. Refactor environment-specific code in services" -ForegroundColor Yellow
Write-Host "4. Implement centralized profile data fetching" -ForegroundColor Yellow

Write-Host "See the CODEBASE_CLEANUP_REPORT.md for detailed instructions on these tasks." -ForegroundColor Cyan 