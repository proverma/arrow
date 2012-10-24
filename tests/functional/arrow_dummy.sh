#!/bin/bash

HUBHOST="http://ondemand.saucelabs.com:80/wd/hub"
BROWSERNAME="sauce_firefox"

if [ "$ARROWCI" == "" ] ; then
	ARROWCI="./node_modules/.bin/arrow"
	HUBHOST="http://ondemand.saucelabs.com:80/wd/hub"
	BROWSERNAME="sauce_firefox"
else
	ARROWCI="./node_modules/.bin/arrow"
	echo Using : "$ARROWCI "

fi;

CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test19.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "LOG" >./data/actual_op/test20.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi