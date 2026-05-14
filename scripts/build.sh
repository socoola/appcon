#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
pnpm next build

echo "Fixing pg module references in .next..."
# Turbopack bundles pg as pg-<hash> in .next/node_modules/, but runtime
# tries to load it from that hash path and fails. We replace the hash
# directory with a symlink/copy to the real pg module.
if [ -d ".next/node_modules" ]; then
  for pg_dir in .next/node_modules/pg-*; do
    if [ -d "$pg_dir" ]; then
      pg_hashed_name=$(basename "$pg_dir")
      echo "  Replacing $pg_hashed_name with real pg module..."
      rm -rf "$pg_dir"
      cp -r node_modules/pg "$pg_dir"
      # Preserve the original package name in package.json so require() works
      if [ -f "$pg_dir/package.json" ]; then
        node -e "
          const fs = require('fs');
          const pkg = JSON.parse(fs.readFileSync('$pg_dir/package.json', 'utf8'));
          pkg.name = '$pg_hashed_name';
          fs.writeFileSync('$pg_dir/package.json', JSON.stringify(pkg, null, 2));
        "
      fi
      echo "  Done: $pg_hashed_name -> real pg"
    fi
  done
fi

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
