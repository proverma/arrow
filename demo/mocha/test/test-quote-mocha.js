var
    self = this,
    testParams = self.testParams,
    quote = testParams["quote"],
    Y,
    chai;

describe('test-quote-mocha', function(){
    describe('test', function(){

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

        it('has correct quote', function(done){

            chai.assert(Y.one(".yfi_rt_quote_summary").one("h2").get('text') == quote);
            done();

        });
    });
});