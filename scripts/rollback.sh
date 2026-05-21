#!/bin/bash

# Fast Rollback Script
# This swaps the Cloudflare DNS record back to the old environment IP
# Usage: ./rollback.sh <OLD_IP>

if [ -z "$1" ]; then
  echo "Usage: ./rollback.sh <OLD_IP>"
  exit 1
fi

OLD_IP=$1
ZONE_ID=${CLOUDFLARE_ZONE_ID}
RECORD_ID=${CLOUDFLARE_RECORD_ID}
API_TOKEN=${CLOUDFLARE_API_TOKEN}

echo "Initiating rollback. Pointing DNS to $OLD_IP..."

curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"content":"'"$OLD_IP"'"}'

echo ""
echo "Rollback command sent. Please verify application health."
