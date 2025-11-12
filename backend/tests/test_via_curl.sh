#!/bin/bash

read -p "Enter transcript: " transcript

curl -X POST http://127.0.0.1:8000/summarize \
  -H "Content-Type: application/json" \
  -d "{
    \"transcript\": \"$transcript\"
  }"