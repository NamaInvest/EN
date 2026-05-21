#!/bin/bash

# Download free open source assets from unDraw (no API key required, static SVG links)
# Using unDraw's direct raw github links for common SVGs

echo "Downloading unDraw assets..."

mkdir -p public/assets/empty-states
mkdir -p public/assets/onboarding
mkdir -p public/assets/errors

# Empty States
curl -s -L "https://raw.githubusercontent.com/undrawio/undraw/master/illustrations/undraw_no_data_qbuo.svg" -o public/assets/empty-states/no-data.svg
curl -s -L "https://raw.githubusercontent.com/undrawio/undraw/master/illustrations/undraw_empty_re_opql.svg" -o public/assets/empty-states/empty.svg

# Errors
curl -s -L "https://raw.githubusercontent.com/undrawio/undraw/master/illustrations/undraw_page_not_found_re_e9o6.svg" -o public/assets/errors/404.svg
curl -s -L "https://raw.githubusercontent.com/undrawio/undraw/master/illustrations/undraw_server_down_s4lk.svg" -o public/assets/errors/500.svg

echo "Assets downloaded successfully!"
