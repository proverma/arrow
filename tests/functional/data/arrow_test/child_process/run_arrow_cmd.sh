#! /bin/sh

echo "*********  Running Arrow  **********"

# arrow_cmd
ARROW_INSTANCE=../../../../..//index.js
mkdir -p ./tmpReport/
rm -rf ./tmpReport/*

$ARROW_INSTANCE test_descriptor.json --report=true --coverage=true  --keepIstanbulCoverageJson=true --logLevel=debug --reportFolder=./tmpReport/

echo "Arrow test done!"
