
var
    self = this,
    testParams = self.testParams,
    Y,
    chai;

describe('finance-topnav-pf-tests',function() {

    describe('test', function(){

        before(function (done) {
            // Initialize chai and YUI
            if(typeof window  == "undefined" && typeof chai  == "undefined"){
                chai = require('chai');
            }
            else{
                chai = window.chai;
            }
            console.log('***In before 2');
            Y = YUI().use('node', function ()
            {
                done();
            });

        });


        it('#1 - Test menu option is present', function(done){
            var menu = testParams.menu,
            /* Locate for elements on the page using css selector. */
                firstMenuItemCSS = Y.one("#y-main-nav li:nth-child(6) li:nth-child(1)");
            chai.assert.isNotNull(firstMenuItemCSS);
            chai.assert.strictEqual(menu[0], firstMenuItemCSS.get("text"));
            done();

        });

    });

});



