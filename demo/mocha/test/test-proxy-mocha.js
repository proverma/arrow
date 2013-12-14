var
    self = this,
    testParams = self.testParams,
    record = testParams["proxyManagerRecord"],
    quote = testParams["quote"],
    Y,
    chai;

describe('test-array-tests', function(){
    describe('#indexOf()', function(){

        before(function (done) {

            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }

            Y = YUI().use('node', function ()
            {
                done();
            });

        });

        it('test array content', function(done){

            chai.assert.isNotNull(record);
            done();

        });
    });
});