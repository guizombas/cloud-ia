#!/usr/bin/env bash
set -euo pipefail

# Wrapper: usa awslocal se existir, senão aws com endpoint do LocalStack
AWSL=$(command -v awslocal >/dev/null 2>&1 && echo "awslocal" || echo "aws --endpoint-url=http://localhost:4566")

# Requisitos: docker, docker-compose, zip, jq e (awslocal ou aws)
docker compose up -d
# criar fila SQS
SQS_QUEUE_URL=$($AWSL sqs create-queue --queue-name postMessageQueue --query QueueUrl --output text)

echo "Fila SQS criada."

echo "SQS_QUEUE_URL=$SQS_QUEUE_URL" > .sqs.env