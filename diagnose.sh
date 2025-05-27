#!/usr/bin/env bash
set -e
CMD="$@"
OUTPUT=$( { $CMD ; } 2>&1 ) || EXIT=$?
echo "$OUTPUT"
if [ -n "$EXIT" ] && [ "$EXIT" != "0" ]; then
  cat <<JSON
{"error":true,"exitCode":$EXIT,"command":"$CMD","log":$(jq -Rs --arg out "$OUTPUT" '$out')}
JSON
fi
