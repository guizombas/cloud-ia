#!/usr/bin/env bash
set -euo pipefail

# Wrapper: usa awslocal se existir, senão aws com endpoint do LocalStack
AWSL=$(command -v awslocal >/dev/null 2>&1 && echo "awslocal" || echo "aws --endpoint-url=http://localhost:4566")
# Requisitos: docker, docker-compose, zip, jq e (awslocal ou aws)

docker compose up -d

# create local dynamodb table without schema
$AWSL dynamodb create-table \
  --table-name cloudia-messages \
  --attribute-definitions \
      AttributeName=conversationId,AttributeType=S \
      AttributeName=timestamp,AttributeType=N \
  --key-schema \
      AttributeName=conversationId,KeyType=HASH \
      AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST