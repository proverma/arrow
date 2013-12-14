/*
 * Like test_func.js, this is just another test as far as arrow is concerned
 * The difference here is the expected values of test.
 * It delegates actual testing to test-lib.js, which performs the actual assertions 
 */
var
    self = this,
    Y,
    chai;

describe('test-func-mocha',function() {

    describe('#test', function(){

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }

            Y = YUI().use(['node','arrow-test-tabview'], function (){
                done();
            });

        });

        it('test tab presence', function(done){

            //Get access to test-lib.js
            var testLib = Y.Arrow.Test.TabView;
            // render tab view
            var tabid = "#things";
            var tabNode = Y.one(document.body).one(tabid);

            testLib.validatePresence(tabNode, ["Asparagus", "Bird", "Coffee"]);
            done();

        });

    });

});


