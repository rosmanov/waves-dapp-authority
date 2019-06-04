#!/bin/bash -
set -x

if [ $# -lt 1 ]; then
    echo >&2 'Usage: ' $0 " public_key"
    exit 2
fi

public_key="$1"

ride_code=$(cat <<-'RIDE'
let osmanov1PubKey = base58'Ezmfw3GgJerTZFgSdzEnXydu1LJ52LsAFZXUF5c63UrF'
sigVerify(tx.bodyBytes, tx.proofs[0], osmanov1PubKey) || true
RIDE
)
ride_code=$(php -r 'echo base64_encode(stream_get_contents(STDIN));' <<< "$ride_code")

curl -X POST --header 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":12345,"method":"set-script","params":{"ride":"'"$ride_code"'","public_key":"'"$public_key"'"}}' \
    -D- -o- \
    http://localhost:3000/api/app/
