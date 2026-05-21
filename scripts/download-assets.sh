#!/bin/bash
# scripts/download-assets.sh
# Reads assets-manifest.json and downloads SVGs from unDraw/public sources.

set -e

echo "📦 Starting Asset Downloader..."

mkdir -p public/assets/empty-states

if ! command -v jq &> /dev/null; then
    echo "❌ jq is not installed. Please install jq to run this script."
    exit 1
fi

MANIFEST="assets-manifest.json"

if [ ! -f "$MANIFEST" ]; then
    echo "❌ $MANIFEST not found."
    exit 1
fi

echo "⬇️ Downloading Empty States SVGs..."
KEYS=$(jq -r '.["empty-states"] | keys[]' "$MANIFEST")

for KEY in $KEYS; do
    URL=$(jq -r ".[\"empty-states\"][\"$KEY\"]" "$MANIFEST")
    DEST="public/assets/empty-states/$KEY"
    
    echo "Downloading $KEY from $URL..."
    curl -sL "$URL" -o "$DEST"
    
    # Optional: If you had squoosh-cli, you could optimize it here, but SVG is already small.
done

echo "✅ Assets download complete! Files are in public/assets/"
