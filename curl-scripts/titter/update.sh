#!/bin/bash

API="http://localhost:4741"
URL_PATH="/post/:id"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
    "post": {
      "body": "'"${BODY}"'"
    }
  }'

echo
