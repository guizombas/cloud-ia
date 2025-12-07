#!/usr/bin/env bash
set -euo pipefail

# Wrapper: usa awslocal se existir, senão aws com endpoint do LocalStack
AWSL=$(command -v awslocal >/dev/null 2>&1 && echo "awslocal" || echo "aws --endpoint-url=http://localhost:4566")

# Requisitos: docker, docker-compose, zip, jq e (awslocal ou aws)
docker compose up -d

source .sqs.env

# criar zips (usar npm i ao invés de ci, pois não há package-lock)
pushd functions/post-message >/dev/null
npm i --omit=dev

echo "Criando zip de post-message..."
mkdir -p ../output
zip -r ../output/post-message.zip node_modules handler-post.js >/dev/null
echo "Zip de post-message criado."
popd >/dev/null

pushd functions/output >/dev/null
# criar lambdas com envs de DB (na mesma rede do compose)
$AWSL lambda create-function \
  --function-name postMessage \
  --runtime nodejs20.x \
  --handler handler-post.handler \
  --zip-file fileb://post-message.zip \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --environment "Variables={AZ_REGION=us-east-1,QUEUE_URL=$SQS_QUEUE_URL,REDIS_URL=redis://redis:6379"} \

echo "Funções criadas."
