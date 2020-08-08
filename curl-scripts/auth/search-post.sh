#!/bin/bash

API="http://localhost:4741"
URL_PATH="/search"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --data '{
    "body": {
      "username": "'"${USERNAME}"'",
      "email": "'"${EMAIL}"'",
    }
  }'

echo
