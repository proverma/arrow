
YUI.add("child-process-tests", function (Y) {
    var suite = new Y.Test.Suite("unit test suite");
    
    suite.add(new Y.Test.Case({
        "test command runner with istanbul instrument": function() {
            self = this;
            Y.IstanbulCommandRunner.setIstanbulRoot(__dirname + '/lib');
            var cp = Y.IstanbulCommandRunner.spawn(__dirname + '/app/child-app.js', ["--foo"]);
            cp.on('exit',function(code){
                console.log('From parrent: sub exit with ' + code);
            });

            // If this test sessinon finished before above spawned child process exit, 
            // seems the child process would be ended, so, please give enough time to
            // wait here
            this.wait(function () {}, 2000);
        }
    }));

    //Note we are not "running" the suite. 
    //Arrow will take care of that. We simply need to "add" it to the runner
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test", "istanbul-command-runner"]});
