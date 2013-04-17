#!/bin/bash

echo ===== Start to check selenium/phantomjs/arrow server =====

sel=`ps aux|grep selenium-server-standalone|grep -v grep | wc -l`
phan=`ps aux|grep phantomjs |grep -v grep |wc -l`
arrow=`ps aux|grep server.js |grep -v grep |wc -l`

if [ $sel -eq 0 ] || [ $phan -eq 0 ] ;then
    echo ""
    echo " please start selenium-server and phantomjs frist..."
    echo " like : java -jar path/to/selenium-server-standalone-***.jar"
    echo "      : phantomjs --webdriver=4445"
    echo ""
    exit 1
fi

if [ $arrow -eq 0 ] ;then
 echo "arrow server not started,will start it for you!"
 `which node` ../../arrow_server/server.js &
fi
echo =====  selenium/phantomjs/arrow server OK! =====

BROWSERNAME="sauce_chrome"
#BROWSERNAME="sauce_firefox"
ARROWCI="node ../../index.js"

TAILCOUNT="-12"
HEADCOUNT="-n 6"

echo =====  Start to run Arrow Functional test using : "$ARROWCI " =====


function echo_and_save()
{
    echo "--- Test$1 Result:"$2" "
    echo "$2" > ./data/actual_op/test$1.txt
    echo "--- Expect Result:`cat ./data/expected_op/expected_test$1.txt`"
}

CNT=1
echo "TEST$CNT: get arrow version"
CMD=`$ARROWCI  --version `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: arrow --help"
CMD=`$ARROWCI --help`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test func js"
CMD=`$ARROWCI ./data/arrow_test/test-func.js --browser=$BROWSERNAME --driver=selenium --logLevel=INFO --lib=data/arrow_test/test-lib.js --capabilities=./data/arrow_test/cap.json --page=http://www.doctor46.com/tabview.html --seleniumHost=$HUBHOST | tail -15 | head -n 9 `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:test func descriptor"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:test --group"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --group=smoke --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test --testName"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --testName=int --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:test --report"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --report=true --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test --report=false"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test --parallel=2"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --parallel=2 --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test --parallel=1"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head $HEADCOUNT  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test --reportFolder  "
CMD=`$ARROWCI ./data/arrow_test/test1_descriptor.json --reportFolder=../report/ --browser=$BROWSERNAME --report=true --logLevel=INFO --capabilities=./cap.json |  tail $TAILCOUNT | head $HEADCOUNT`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test all descriptor"
CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json |  tail $TAILCOUNT | head -n 10  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:test all descriptor with report true"
CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --report=true --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail $TAILCOUNT | head -n 10 `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test controller"
CMD=`$ARROWCI ./data/arrow_test/controller_descriptor_fix.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:test func with page and lib"
CMD=`$ARROWCI ./data/arrow_test/test-func.js --page=http://www.doctor46.com/tabview.html --lib=./data/arrow_test/test-lib.js --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json |  tail $TAILCOUNT | head $HEADCOUNT  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test wrong descriptor"
CMD=`$ARROWCI ./data/arrow_test/controller-descriptor-fail.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --report=true --logLevel=INFO --capabilities=./cap.json | grep "Total Number of"  `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test descriptor disabled"
CMD=`$ARROWCI ./data/arrow_test/test-descriptor-disabled.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --capabilities=./cap.json --report=true --logLevel=INFO --capabilities=./cap.json | grep "SessionFactory" `
CMD1=`sed -e s/'^.\{31\}'//g ./data/arrow_test/dummy_test.txt `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test dimensions"
CMD=`$ARROWCI ./data/arrow_test/test-descriptor-dimensions.json --context=environment:development --browser=$BROWSERNAME --logLevel=INFO --capabilities=./cap.json| tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test sauce_phantomjs"
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test sauce_phantomjs and log info"
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "LOG" | head -1 `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: for scan lib test server side"
# for scan lib test
# --browser=chrome --driver=selenium
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-unit-no-lib.js  --shareLibPath=./data/arrow_test/martini_lib/  --capabilities=./data/arrow_test/cap.json |  tail $TAILCOUNT | head $HEADCOUNT`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: for scan lib test client side"
CMD=`$ARROWCI ./data/arrow_test/test-func-use-martini.js --page=http://www.doctor46.com/tabview.html --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: for scan lib test no exist lib"
CMD=`$ARROWCI ./data/arrow_test/test-func-use-martini.js --browser=$BROWSERNAME  --shareLibPath=./data/undefined/undefined-path --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "ERROR" |head -1 `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: test descriptor and common lib"
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-func-no-commonlib.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json --logLevel=info |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: sharelib external controller test"
CMD=`$ARROWCI ./data/arrow_test/sharelib-external-controller-test.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json --report=false --logLevel=debug |grep 'Loading controller'| tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT:  scan lib test with enable ShareLib YUI Loader"
# for scan lib test with enable ShareLib YUI Loader
# this will auto start arrow server
# --browser=chrome --driver=selenium
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-unit-no-lib.js --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/  --enableShareLibYUILoader=true --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail $TAILCOUNT | head $HEADCOUNT`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test --engine=jasmine"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/jasmine-bdd-test.js --engine=jasmine |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test --engine=mocha and --engineConfig"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/mocha-tdd.js --engine=mocha  --engineConfig=./data/arrow_test/engine_test/engine_unit_test/mocha-config.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test descriptor with engine=mocha and lib"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/mocha_engine_test.json |  tail $TAILCOUNT | head $HEADCOUNT`
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test hybrid engine in server side"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/hybrid_engine_test.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test descriptor with controller"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_mocha_with_controller.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

let "CNT=$CNT+1"
echo "TEST$CNT: engine test ,test hybrid engine in client side"
CMD=`$ARROWCI ./data/arrow_test/engine_test/hybrid_engine_test.json |  tail $TAILCOUNT | head $HEADCOUNT `
echo_and_save $CNT "$CMD"
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: "$CMD""
	echo "RESULT: $RESULT"
} fi

echo "===== Arrow test done! ====="