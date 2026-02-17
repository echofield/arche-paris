#!/bin/bash
# Test CORS Preflight with curl

echo "Testing OPTIONS preflight for card-gate/refresh..."
echo ""

curl -v -X OPTIONS \
  'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' \
  -H 'Origin: https://www.xn--arch-paris-e7a.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization, x-requested-with, apikey' \
  2>&1 | grep -i "access-control\|< HTTP\|x-debug"
