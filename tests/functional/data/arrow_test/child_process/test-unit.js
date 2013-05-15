
YUI.add("mock-child-process-tests", function (Y) {
    var suite = new Y.Test.Suite("unit test suite");
    
    suite.add(new Y.Test.Case({
        "test mocked child_process.spawn by mockery": function() {
            self = this;

            var mockery = require('mockery');
            var mocker = require("../../../../../sharelib/lib/server/mock-child-process");
            var mock_child_process = {
               spawn: mocker.spawn,
               fork: mocker.fork
            };

            mocker.set_istanbul_root("../");
            //mocker.set_exclude_pattern("**/temp-for*");
            mockery.registerMock('child_process', mock_child_process);
            mockery.enable({ useCleanCache: true });

            var spawn = require("child_process").spawn;
            var cp = spawn("./app/child-app.js", ["--foo"]);
            cp.stdout.pipe(process.stdout, {end: false});
            cp.stderr.pipe(process.stderr, {end: false});
            cp.stdin.end();
            cp.on('exit',function(code){
                console.log('From parent: spawned child exit with code: ' + code);
            });

            // If this test sessinon finished before above spawned child process exit, 
            // seems the child process would be ended, so, please give enough time to
            // wait here
            this.wait(function () {}, 8000);
        },

        "ignore: test child_process.fork mocked by previous test": function() {
            self = this;

            var fork = require("child_process").fork;
            var cp = fork("./app/child-app.js", ["--qux"]);
            cp.send({hello: 'world'});
            cp.on('exit',function(code){
                console.log('From parent: forked child exit with code: ' + code);
            });

            this.wait(function () {}, 8000);
        }
    }));

    //Note we are not "running" the suite. 
    //Arrow will take care of that. We simply need to "add" it to the runner
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test", "media-greeter"]});
