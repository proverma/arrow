#!/bin/bash

BROWSERNAME="sauce_firefox"

ARROWCI="node ../../index.js"
echo Using : "$ARROWCI "

CMD=`$ARROWCI  --version >./data/actual_op/test1.txt`
RESULT=`$CMD`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI --help`
echo $CMD >./data/actual_op/test2.txt
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test-func.js --browser=$BROWSERNAME --driver=selenium --logLevel=INFO --lib=data/arrow_test/test-lib.js --capabilities=./data/arrow_test/cap.json --page=http://www.doctor46.com/tabview.html --seleniumHost=$HUBHOST | tail -2 | head -1  >./data/actual_op/test3.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi



CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test4.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi


CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --group=smoke --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test5.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --testName=int --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test6.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --report=true --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test7.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test8.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --parallel=2 --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test9.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test10.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test1_descriptor.json --reportFolder=../report/ --browser=$BROWSERNAME --report=true --logLevel=INFO --capabilities=./cap.json | tail -n 2 > ./data/actual_op/test11.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test12.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --report=true --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -n 9  >./data/actual_op/test13.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/controller_descriptor_fix.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -n 2  >./data/actual_op/test14.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test-func.js --page=http://www.doctor46.com/tabview.html --lib=./data/arrow_test/test-lib.js --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json | tail -n 2  >./data/actual_op/test15.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/controller-descriptor-fail.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --report=true --logLevel=INFO --capabilities=./cap.json | grep "Total Number of"  >./data/actual_op/test16.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test-descriptor-disabled.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --capabilities=./cap.json --report=true --logLevel=INFO --capabilities=./cap.json | grep "SessionFactory" >./data/arrow_test/dummy_test.txt`
CMD1=`sed -e s/'^.\{31\}'//g ./data/arrow_test/dummy_test.txt > ./data/actual_op/test17.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

CMD=`$ARROWCI ./data/arrow_test/test-descriptor-dimensions.json --context=environment:development --browser=$BROWSERNAME --logLevel=INFO --capabilities=./cap.json| tail -n 2 >./data/actual_op/test18.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

#test 19
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test19.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

# test 20
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "LOG" | head -1 >./data/actual_op/test20.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi
# test 21
# for scan lib test
# --browser=chrome --driver=selenium
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-unit-no-lib.js --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test21.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi
# test 22
CMD=`$ARROWCI ./data/arrow_test/test-func.js --page=http://www.doctor46.com/tabview.html --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test22.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi
# test 23
CMD=`$ARROWCI ./data/arrow_test/test-func.js --browser=$BROWSERNAME  --shareLibPath=./data/undefined/undefined-path --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "ERROR" |head -1 >./data/actual_op/test23.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi
# test 24
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-func-no-commonlib.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json | grep "LOG" >./data/actual_op/test24.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi
# test 25
CMD=`$ARROWCI ./data/arrow_test/sharelib-external-controller-test.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json | grep "LOG" >./data/actual_op/test25.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi