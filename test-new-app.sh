#!/bin/bash -
set -x

curl -X POST --header 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":12345,"method":"new-app","params":{"amount":100000}}' \
    -D- -o- \
    http://localhost:3000/api/app/
