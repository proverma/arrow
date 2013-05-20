function addProxyClient() {
    function queryTestStatus(cb) {
        try{
            if(window.parent.ARROW && window.parent.ARROW.testReport && window.parent.ARROW.testReport!={}){
                return cb(true);
            }
        }catch(e){}

        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", %PROXY_PATH%, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return cb(false);
                if (xhr.status == 200) cb(true);
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
            xhr.open("POST", %PROXY_PATH%, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) return console.log('Failed to send coverage data. Status code: ' + xhr.status);
                return console.log('Coverage data sent to proxy from :' + location.href);
            };
            xhr.send(JSON.stringify({
                    coverage: window.__coverage__ || {},
                    origin: location.href
                }
            ));
        } else {
            console.log("XMLHttpRequest required to send coverage report.");
        }
    }
    var tid, maxAttamp = 100;
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
    }, 200);
}

(function (func){
    var oldonload = window.onload;
    if (typeof window.onload != 'function')
    {
        window.onload = func;
    }
    else
    {
        window.onload = function()
        {
            oldonload();
            func();
        }
    }
})(addProxyClient)