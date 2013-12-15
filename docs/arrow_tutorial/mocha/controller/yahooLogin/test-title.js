/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var
    self = this,
    testParams = self.testParams,
    quote = testParams["quote"],
    Y,
    chai;

describe('Title test of the test', function(){

    describe('tests', function(){

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

        it('has correct title', function(done){

            //In order to paramertize this, instead of having a static title, we call it from the config
            var title = testParams["title"];
            console.log('**Title:' + title + ", " + document.title);
//            chai.assert("Yahoo" == document.title);
            chai.assert(title == document.title);

            done();

        });
    });
});