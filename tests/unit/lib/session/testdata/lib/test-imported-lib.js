YUI.add("import-lib", function(Y) {

    var Assert = Y.Assert;

    var self = Y.namespace("Media.Test").ImportTestLib = {

        testUrl : function(url) {
            setTimeout(function() {
                Y.log('[Logger] Browser now Loading URL [' + url + ']');
                window.open(targetUrl, '_self');
            }, timeout);
        }
        
    };

}, "0.1", {
    requires : ["test", "node"]
});
