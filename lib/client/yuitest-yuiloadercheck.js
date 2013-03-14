
function checkURL(url, cb) {
    YUI().use("io-xdr", function (Y) {
        function onComplete(transactionid, response, arguments) {
            // NOTE: In an XDR transaction, only the responseText or the responseXML property is defined.
//            if(console)console.log(" Arrow server responese: "+response.responseText+" and status code: "+response.status);
            if (response.status == "200" || response.responseText == "yuiLoaderOK") {
                cb(true);
            } else {
                cb(false);
            }
        }
        Y.on('io:complete', onComplete);
        Y.io(url,{timeout:3000});
    });
}

(function getPropArrowServerIP() {

    function asyncForEach(array, fn, callback) {
        var completed = 0;
        if(array.length === 0) {
            callback(); // done immediately
        }
        var len = array.length;
        for(var i = 0; i < len; i++) {
            fn(array[i], function() {
                completed++;
                if(completed === array.length) {
                    callback();
                }
            });
        }
    };

    var hasAcessableIP = false;
    asyncForEach(ARROW_SERVER_IP_ADDR_ALL, function(el, callback) {
        checkURL("http://" + el + "/yuiLoader", function (isAccessible) {
            // if not accessable,then we dont set yui group to ignore yui loader being a blocker.
            if (isAccessible) {
                if(!hasAcessableIP){
                    if(console)console.log(" arrow server: " + el + " is acessable,YUI loader can work now!");
                    resetYUIGroupBase(el);
                    startArrowTest();
                }
                hasAcessableIP = true;
            }else{
                if(console)console.error(" arrow server: " + el + " is not acessable,YUI loader can't fetch external modules!");
            }
            callback();
        });
    }, function() {
        if (!hasAcessableIP) {
            if(console)console.error("******* Error ********: can't access any arrow server ip address at this page,yui loader for externale modules(like arrow share lib) was disabled !" +
                "please make sure your arrow server is accessable or please set params \'enableShareLibYUILoader\' to false when run arrow cmd ");
            startArrowTest();
        }
    });
})()