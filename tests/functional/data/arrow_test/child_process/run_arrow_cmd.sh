#! /bin/sh

echo "*********  Running Arrow  **********"

# arrow_cmd
ARROW_INSTANCE=../node_modules/yahoo-arrow/index.js
mkdir -p ./tmpReport/
rm -rf ./tmpReport/*

$ARROW_INSTANCE child_process-descriptor.json --report=true --coverage=true  --keepIstanbulCoverageJson=true --logLevel=debug --reportFolder=./tmpReport/

echo "Arrow test done!"
