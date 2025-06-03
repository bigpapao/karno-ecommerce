#!/bin/bash
# Karno E-Commerce Platform - Cleanup Script
# This script implements the recommendations from the codebase cleanup report

echo "Starting Karno codebase cleanup..."

# Create backup directory
BACKUP_DIR="./cleanup_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
echo "Created backup directory: $BACKUP_DIR"

# Function to backup a file before removing/modifying it
backup_file() {
  local file_path=$1
  local backup_path="$BACKUP_DIR/$(dirname $file_path)"
  
  mkdir -p "$backup_path"
  cp "$file_path" "$backup_path/" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "Backed up: $file_path"
  else
    echo "Warning: Could not backup $file_path"
  fi
}

echo "-------------------------------------"
echo "1. Removing test routes files"
echo "-------------------------------------"

# Backup and remove test route files
TEST_ROUTES=(
  "backend/src/routes/db-test.routes.js"
  "backend/src/routes/admin/db-test.routes.js"
  "backend/src/routes/admin/payment-test.routes.js"
)

for file in "${TEST_ROUTES[@]}"; do
  if [ -f "$file" ]; then
    backup_file "$file"
    rm "$file"
    echo "Removed: $file"
  else
    echo "Warning: $file not found"
  fi
done

echo "-------------------------------------"
echo "2. Renaming enhanced routes files"
echo "-------------------------------------"

# Rename product.routes.enhanced.js
if [ -f "backend/src/routes/product.routes.enhanced.js" ]; then
  backup_file "backend/src/routes/product.routes.enhanced.js"
  
  # Check if product.routes.js exists
  if [ -f "backend/src/routes/product.routes.js" ]; then
    echo "Both product.routes.js and product.routes.enhanced.js exist."
    echo "Please manually review and merge these files."
  else
    # Rename enhanced to standard name
    mv "backend/src/routes/product.routes.enhanced.js" "backend/src/routes/product.routes.js"
    echo "Renamed: product.routes.enhanced.js -> product.routes.js"
  fi
fi

echo "-------------------------------------"
echo "3. Checking recommendation-monitoring routes"
echo "-------------------------------------"

if [ -f "backend/src/routes/recommendation-monitoring.routes.js" ]; then
  backup_file "backend/src/routes/recommendation-monitoring.routes.js"
  echo "Note: recommendation-monitoring.routes.js found."
  echo "Please review if this is needed in production."
fi

echo "-------------------------------------"
echo "4. Updating server.js to remove test route imports"
echo "-------------------------------------"

if [ -f "backend/src/server.js" ]; then
  backup_file "backend/src/server.js"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Remove test route imports and usages
  cat "backend/src/server.js" | \
    grep -v "import dbTestRoutes from './routes/db-test.routes.js';" | \
    grep -v "import adminDbTestRoutes from './routes/admin/db-test.routes.js';" | \
    grep -v "app.use('/api/db-test', dbTestRoutes);" | \
    grep -v "app.use('/api/admin/db-test', adminDbTestRoutes);" > $TEMP_FILE
  
  # Replace original file
  mv $TEMP_FILE "backend/src/server.js"
  echo "Updated: backend/src/server.js (removed test route imports)"
fi

echo "-------------------------------------"
echo "5. Updating admin.routes.js to remove test route imports"
echo "-------------------------------------"

if [ -f "backend/src/routes/admin.routes.js" ]; then
  backup_file "backend/src/routes/admin.routes.js"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Remove test route imports and usages
  cat "backend/src/routes/admin.routes.js" | \
    grep -v "import paymentTestRoutes from './admin/payment-test.routes.js';" | \
    grep -v "router.use('/payment-test', paymentTestRoutes);" > $TEMP_FILE
  
  # Replace original file
  mv $TEMP_FILE "backend/src/routes/admin.routes.js"
  echo "Updated: backend/src/routes/admin.routes.js (removed test route imports)"
fi

echo "-------------------------------------"
echo "6. Consolidate documentation files"
echo "-------------------------------------"

# Create docs directory if it doesn't exist
mkdir -p "docs"

# Move implementation docs to docs directory
if [ -f "backend/src/PROFILE_VERIFICATION_IMPLEMENTATION.md" ]; then
  cp "backend/src/PROFILE_VERIFICATION_IMPLEMENTATION.md" "docs/"
  echo "Copied PROFILE_VERIFICATION_IMPLEMENTATION.md to docs/ directory"
fi

if [ -f "backend/src/SIMPLE_AUTH_IMPLEMENTATION.md" ]; then
  cp "backend/src/SIMPLE_AUTH_IMPLEMENTATION.md" "docs/"
  echo "Copied SIMPLE_AUTH_IMPLEMENTATION.md to docs/ directory"
fi

echo "-------------------------------------"
echo "Cleanup Complete!"
echo "-------------------------------------"

echo "Files backed up to: $BACKUP_DIR"
echo "Please review the following tasks that require manual intervention:"
echo "1. Standardize authentication middleware (authenticate vs. protect)"
echo "2. Clean up User model address storage redundancy"
echo "3. Refactor environment-specific code in services"
echo "4. Implement centralized profile data fetching"

echo "See the CODEBASE_CLEANUP_REPORT.md for detailed instructions on these tasks." 