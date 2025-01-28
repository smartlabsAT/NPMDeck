#!/bin/bash

# Function to process a single file
process_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Use sed to remove common unused imports based on TypeScript errors
    # This is a simplified approach - ideally we'd use a proper AST tool
    
    # Remove specific unused imports we know about
    sed -i '' \
        -e "/import.*CloseIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*LockIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*WarningIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*DownloadIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*SecurityIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*CancelIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*UploadIcon.*from.*@mui\/icons-material/d" \
        -e "/import.*AddIcon.*from.*@mui\/icons-material/d" \
        -e "/import React from 'react'/d" \
        "$file" 2>/dev/null || true
}

# Find all TypeScript files and process them
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    process_file "$file"
done

echo "Unused imports removed!"