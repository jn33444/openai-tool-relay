#!/usr/bin/env bash
set -e
CMD="$@"
OUTPUT=$( { $CMD ; } 2>&1 ) || EXIT=$?
echo "$OUTPUT"
if [ -n "$EXIT" ] && [ "$EXIT" != "0" ]; then
  ESCAPED=$(printf '%s\n' "$OUTPUT" | sed 's/"/\\"/g')
  cat <<JSON
{"error":true,"exitCode":$EXIT,"command":"$CMD","log":"$ESCAPED"}
JSON
fi
