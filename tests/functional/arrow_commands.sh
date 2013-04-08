#!/bin/bash

echo ===== Start to check selenium/phantomjs/arrow server =====
sel=`ps aux|grep selenium-server-standalone|grep -v grep | wc -l`
phan=`ps aux|grep phantomjs |grep -v grep |wc -l`
arrow=`ps aux|grep server.js |grep -v grep |wc -l`
if [ $sel -eq 0 ] || [ $phan -eq 0 ] || [ $arrow -eq 0 ] ;then
    echo " please start selenium-server , phantomjs and arrow server frist..."
    echo " like : java -jar path/to/selenium-server-standalone-***.jar"
    echo "      : phantomjs --webdriver=4445"
    echo "      : node path/to/arrow/arrow_server/server.js "
    exit 1
fi
echo =====  selenium/phantomjs/arrow server OK! =====

BROWSERNAME="sauce_firefox"
ARROWCI="node ../../index.js"
echo =====  Start to run Arrow Functional test using : "$ARROWCI " =====

echo "TEST1: get arrow version"
CMD=`$ARROWCI  --version >./data/actual_op/test1.txt`
RESULT=`$CMD`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST2: arrow --help"
CMD=`$ARROWCI --help`
echo $CMD >./data/actual_op/test2.txt
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST3: test func js"
CMD=`$ARROWCI ./data/arrow_test/test-func.js --browser=$BROWSERNAME --driver=selenium --logLevel=INFO --lib=data/arrow_test/test-lib.js --capabilities=./data/arrow_test/cap.json --page=http://www.doctor46.com/tabview.html --seleniumHost=$HUBHOST | tail -2 | head -1  >./data/actual_op/test3.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi


echo "TEST4:test func descriptor"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test4.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST5:test --group"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --group=smoke --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test5.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST6: test --testName"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --testName=int --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test6.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST7:test --report"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --report=true --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test7.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST8: test --report=false"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test8.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST9: test --parallel=2"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --parallel=2 --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test9.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST10: test --parallel=1"
CMD=`$ARROWCI ./data/arrow_test/test_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test10.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST11: test --reportFolder  "
CMD=`$ARROWCI ./data/arrow_test/test1_descriptor.json --reportFolder=../report/ --browser=$BROWSERNAME --report=true --logLevel=INFO --capabilities=./cap.json | tail -n 2 > ./data/actual_op/test11.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST12: test all descriptor"
CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -2 | head -1  >./data/actual_op/test12.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST13:test all descriptor with report true"
CMD=`$ARROWCI ./data/arrow_test/**/*_descriptor.json --report=true --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -n 9  >./data/actual_op/test13.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST14: test controller"
CMD=`$ARROWCI ./data/arrow_test/controller_descriptor_fix.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./cap.json | tail -n 2  >./data/actual_op/test14.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST15:test func with page and lib"
CMD=`$ARROWCI ./data/arrow_test/test-func.js --page=http://www.doctor46.com/tabview.html --lib=./data/arrow_test/test-lib.js --browser=$BROWSERNAME --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json | tail -n 2  >./data/actual_op/test15.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST16: test wrong descriptor"
CMD=`$ARROWCI ./data/arrow_test/controller-descriptor-fail.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --report=true --logLevel=INFO --capabilities=./cap.json | grep "Total Number of"  >./data/actual_op/test16.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST17: test descriptor disabled"
CMD=`$ARROWCI ./data/arrow_test/test-descriptor-disabled.json --browser=$BROWSERNAME --seleniumHost=$HUBHOST --capabilities=./cap.json --report=true --logLevel=INFO --capabilities=./cap.json | grep "SessionFactory" >./data/arrow_test/dummy_test.txt`
CMD1=`sed -e s/'^.\{31\}'//g ./data/arrow_test/dummy_test.txt > ./data/actual_op/test17.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST18: test dimensions"
CMD=`$ARROWCI ./data/arrow_test/test-descriptor-dimensions.json --context=environment:development --browser=$BROWSERNAME --logLevel=INFO --capabilities=./cap.json| tail -n 2 >./data/actual_op/test18.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST19: test sauce_phantomjs"
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --logLevel=INFO --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test19.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST20: test sauce_phantomjs and log info"
CMD=`$ARROWCI ./data/arrow_test/test-unit.js --browser=sauce_phantomjs --lib=./data/arrow_test/greeter.js --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "LOG" | head -1 >./data/actual_op/test20.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST21: for scan lib test server side"
# for scan lib test
# --browser=chrome --driver=selenium
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-unit-no-lib.js --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test21.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST22: for scan lib test client side"
CMD=`$ARROWCI ./data/arrow_test/test-func-use-martini.js --page=http://www.doctor46.com/tabview.html --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test22.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST23: for scan lib test no exist lib"
CMD=`$ARROWCI ./data/arrow_test/test-func-use-martini.js --browser=$BROWSERNAME  --shareLibPath=./data/undefined/undefined-path --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | grep "ERROR" |head -1 >./data/actual_op/test23.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST24: test descriptor and common lib"
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-func-no-commonlib.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json --logLevel=info | tail -2 | head -1 >./data/actual_op/test24.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST25: sharelib external controller test"
CMD=`$ARROWCI ./data/arrow_test/sharelib-external-controller-test.json --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/ --seleniumHost=$HUBHOST --capabilities=./cap.json | tail -2 | head -1 >./data/actual_op/test25.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST26:  scan lib test with enable ShareLib YUI Loader"
# for scan lib test with enable ShareLib YUI Loader
# this will auto start arrow server
# --browser=chrome --driver=selenium
CMD=`$ARROWCI ./data/arrow_test/sharelib-test-unit-no-lib.js --browser=$BROWSERNAME --shareLibPath=./data/arrow_test/martini_lib/  --enableShareLibYUILoader=true --seleniumHost=$HUBHOST --capabilities=./data/arrow_test/cap.json | tail -2 | head -1 >./data/actual_op/test26.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST27: engine test ,test --engine=jasmine"

CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/jsamine-bdd-test.js --engine=jasmine | tail -2 | head -1 >./data/actual_op/test27.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST28: engine test ,test --engine=mocha and --engineConfig"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/mocha-tdd.js --engine=mocha  --engineConfig=./data/arrow_test/engine_test/engine_unit_test/mocha-config.json | tail -2 | head -1 >./data/actual_op/test28.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST29: engine test ,test descriptor with engine=mocha and lib"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/mocha_engine_test_descriptor.json | tail -2 | head -1 >./data/actual_op/test29.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST30: engine test ,test hybrid engine in server side"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_unit_test/hybrid_engine_test_descriptor.json | tail -2 | head -1 >./data/actual_op/test30.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST31: engine test ,test descriptor with controller"
CMD=`$ARROWCI ./data/arrow_test/engine_test/engine_mocha_with_controller.json | tail -2 | head -1 >./data/actual_op/test31.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi

echo "TEST32: engine test ,test hybrid engine in client side"
CMD=`$ARROWCI ./data/arrow_test/engine_test/hybrid_engine_test_descriptor.json | tail -2 | head -1 >./data/actual_op/test32.txt`
if [ $? != 0 ]; then
{
    echo "ERROR!"
	echo "CMD: $CMD"
	echo "RESULT: $RESULT"
} fi