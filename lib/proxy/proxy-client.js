function addProxyClient() {
    function queryTestStatus(cb) {
        try{
            if(window.ARROW || window.parent.ARROW){ // default window.ARROW={} and can be accessed in outside frame
                 window.ARROW = window.ARROW || window.parent.ARROW;
                if( window.ARROW.testReport!=null && window.ARROW.testReport!={}){
                    return cb(true);
                }else{
                    return cb(false);
                }
            }
        }catch(e){} // can't access window.ARROW, maybe in cross-domian iframe,then will send GET request to proxy server
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET","%PROXY_PATH%?sid=%SESSION_ID%", true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return cb(false);
                if (xhr.status == 200)return cb(true);
                return cb(false);
            };
            xhr.send(null);
        } else {
            console.log("XMLHttpRequest required to send coverage report.");
            return cb(false);
        }
    }
    function sendCoverageData() {
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "%PROXY_PATH%", true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) return console.log('Failed to send coverage data. Status code: ' + xhr.status);
                return console.log('Coverage data sent to proxy from :' + location.href);
            };
            xhr.send(JSON.stringify({
                    coverage: window.__coverage__ || {},
                    origin: location.href,
                    sid: "%SESSION_ID%"
                }
            ));
        } else {
            console.log("XMLHttpRequest required to send coverage report.");
        }
    }
    var tid, inttime = 400,maxAttamp = %TIME_OUT% / inttime;
    tid = setInterval(function () {
        maxAttamp = maxAttamp - 1;
        queryTestStatus(function (finished) {
            if (finished) {
                sendCoverageData();
                clearInterval(tid);
            } else {
                if (maxAttamp < 0) {
                    clearInterval(tid);
                    console.log("timeout and no coverage data send in url:" + location.href);
                }
            }
        });
    }, inttime);
}
(function (func){
    var oldonload = window.onload;
    if (typeof window.onload != 'function'){
        func();
    }else{
        window.onload = function(){
            oldonload();
            func();
        }
    }
})(addProxyClient)