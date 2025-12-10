#!/bin/bash
set -euo pipefail

scripts/create_dynamo_table.sh && scripts/create_sqs.sh && scripts/create_functions.sh && scripts/create_gateway.sh