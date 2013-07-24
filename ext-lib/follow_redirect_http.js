var nativeHttps = require('https'),
    nativeHttp = require('http'),
    url = require('url'),
    logger = require("log4js").getLogger("proxyHttpRequest");

// Extend a given object with all the properties in passed-in object(s).
var extend = function (obj) {
    function each(obj, iterator, context) {
        if (obj == null) return;
        if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === {}) return;
            }
        } else {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === {}) return;
                }
            }
        }
    }

    each(Array.prototype.slice.call(arguments, 1), function (source) {
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

var maxRedirects = module.exports.maxRedirects = 10,
    protocols = {
        https: nativeHttps,
        http: nativeHttp
    };

// Only use GETs on redirects
for (var protocol in protocols) {
    // h is either our cloned http or https object
    var h = function () {
    };
    h.prototype = protocols[protocol];
    h = new h();

    module.exports[protocol] = h;

    h.request = function (h) {
        return function (options, callback, redirectOptions) {

            var max,
                redirect,
                reqUrl,
                clientRequest;

            redirectOptions = redirectOptions || {};

            max = (typeof options === 'object' && 'maxRedirects' in options) ? options.maxRedirects : exports.maxRedirects;

            redirect = extend({
                count: 0,
                max: max,
                clientRequest: null,
                userCallback: callback
            }, redirectOptions);

            //Emit error if too many redirects
            if (redirect.count > redirect.max) {
                var err = new Error('Max redirects exceeded. To allow more redirects, pass options.maxRedirects property.');
                redirect.clientRequest.emit('error', err);
                return redirect.clientRequest;
            }
            redirect.count++;

            //Parse URL from options
            if (typeof options === 'string') {
                reqUrl = options;
            }
            else {
                reqUrl = url.format(extend({ protocol: protocol }, options));
            }

            clientRequest = h.__proto__.request(options, redirectCallback(reqUrl, redirect));

            // Save user's clientRequest so we can emit errors later
            if (!redirect.clientRequest) redirect.clientRequest = clientRequest;

            // ClientRequest callback for redirects
            function redirectCallback(reqUrl, redirect) {
                return function (res) {
                    // status must be 300-399 for redirects
                    if (res.statusCode < 300 || res.statusCode > 399) {
                        logger.trace('[' + res.statusCode + '] callback user on url ' + reqUrl);
                        return redirect.userCallback(res);
                    }
                    // no `Location:` header => nowhere to redirect
                    if (!('location' in res.headers)) {
                        logger.trace('[no location header] callback user on url ' + reqUrl);
                        return redirect.userCallback(res);
                    }
                    // save the original clientRequest to our redirectOptions so we can emit errors later
                    // need to use url.resolve() in case location is a relative URL
                    var redirectUrl = url.resolve(reqUrl, res.headers['location']),proto;
                    // we need to call the right api (http vs https) depending on protocol
                    proto = url.parse(redirectUrl).protocol;
                    proto = proto.substr(0, proto.length - 1);
                    logger.debug('Redirecting from ' + reqUrl + ' to ' + redirectUrl);
                    return module.exports[proto].get(url.parse(redirectUrl), redirectCallback(reqUrl, redirect), redirect);
                };
            }

            return clientRequest;
        }
    }(h);

    h.get = function (h) {
        return function (options, cb, redirectOptions) {
            var req = h.request(options, cb, redirectOptions);
            req.end();
            return req;
        };
    }(h);
}
