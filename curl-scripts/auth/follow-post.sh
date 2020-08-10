#!/bin/bash

API="http://localhost:4741"
URL_PATH="/follow"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Authorization: Bearer ${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
      "userId": "'"${USERID}"'"
  }'

echo