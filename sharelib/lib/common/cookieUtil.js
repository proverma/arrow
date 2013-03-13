/*global require: true, console: true, escape: true, window:true, process:true, module:true */

/*
* Copyright (c) 2012 Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/** Yahoo Cookie test helper module, and it could be use in both browser and node.js.
 * @module cookieUtil
 */
YUI.add('cookieUtil', function(Y) {
    Y.namespace("Arrow");
var ERRORMSG = {
    UNKNOWN_COOKIE_NAME : "unknown cookie name ",
    INVALID_COOKIE_NAME : "invalid cookie name ",
    INVALID_COOKIE_VALUE : "invalid cookie value",
    MISSING_PARAMETER_NAME : "missing parameter: name is expected. ",
    MISSING_PARAMETER_VALUE : "missing parameter: cookie value is expected.",
    UNSUPPORTED_OPTION : "unsupported option is found.",
    INVALID_SUBCOOKIE : "invalid subcookie name or subcookie value.",
    UNEXPECTED_RESPONSE : "unexpected response received. either cookies or location is missing.",
    INVALID_OBJECT : " is expected as an object.",
    WRONG_PARAMETER_COOKIEVALUE : "wrong parameter: cookie value(string) is expected.",
    WRONG_PARAMETER_SUBFIELDS_ARRAY : "wrong parameter: a subFields array expected.",
    WRONG_PARAMETER_SUBFIELDS_OBJECT : "wrong parameter: a subFields object is expected.",
    WRONG_PARAMETER_CALLBACK : "wrong parameter: a callback is expected.",
    INVALID_PARAMETER : "wrong parameter: following parameters are expected:",
    EXISTING_COOKIE : "the cookie has existed. name: ",
    NONEXISTING_COOKIE : "the cookie doesn't exist. name: ",
    INVALID_COOKIEJAR : "cookiejar is undefined or blank, please input a valid value. ",
    UNDEFINED_HEADER : "header is undfined, please input a valid header. ",
    WRONG_PARAMETER_COOKIES_OBJECT : "wrong parameter: a cookies object is expected.",
    ILLEGAL_RESPONSE : "illegal response",
    NO_COOKIE_FROM_SERVER : "no cookies info from server side",
    INVALID_CONFIG : "invalid configuration file type."
};
var defaultconfig = {
    separator : '&',
    equalChar : "=",
    semiColon : ";",
    comma : ",",
    space : " ",
    userAgent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:16.0) Gecko/20100101 Firefox/16.0'
};
/**
 * @param {Object} config - configuration object
 */
CookieUtil = function (config) {
    if (config && typeof (config) === "object") {
        this.config = config || {};
    } else {
        throw new Error(ERRORMSG.INVALID_CONFIG);
    }
};

CookieUtil.prototype = {
    /**
     * to get separator in cookie value,
     * if it is not urlEncode, return &
     * if it is urlEncode, return %26
     * @return {String} '=' or '%26'
     * @private
     */
    _getSeparator: function () {
    var separator = defaultconfig.separator;
    if (this.config.urlEncode) {
        separator = escape(separator);
    }
    return separator;
    },
    /**
     * to get equal char in cookie,
     * if it is not urlEncode, return =
     * if it is urlEncode, return %3D
     * @return {String} '=' or '%3D'
     * @private
     */
    _getEqualChar: function() {
        var equalChar = defaultconfig.equalChar;
        if (this.config.urlEncode) {
            equalChar = escape(equalChar);
        }
        return equalChar;
    },
    /**
     * to get semi colon,
     * if it is not urlEncode, return ;
     * if it is urlEncode, return %3B
     * @return {String} ';' or '%3B'
     * @private
     */
    _getSemicolon : function () {
        var semiColon = defaultconfig.semiColon;
        if (this.config.urlEncode) {
            semiColon = escape(semiColon);
        }
        return semiColon;
    },
    /**
     * to get comma,
     * if it is not urlEncode, return ,
     * if it is urlEncode, return %2C
     * @return {String} ',' or '%2C'
     * @private
     */
    _getComma : function () {
    var comma = defaultconfig.comma;
    if (this.config.urlEncode) {
        comma = escape(comma);
    }
    return comma;
    },
    /**
     * to get white space in cookie,
     * if it is not urlEncode, return space ' '
     * if it is urlEncode, return %20
     * @return {String} ' ' or '%20'
     * @private
     */
    _getSpace : function () {
        var space = defaultconfig.space;
        if (this.config.urlEncode) {
            space = escape(space);
        }
        return space;
    },
    /**
     * generate a customized cookie for the user
     * @example
     *
     * createCustCookie ( "custcookie",
     *		    			{
     *							fieldA: valueA,
     *							fieldB: valueB,
     *				    		},
     *					    {
     *							domain: ".xx.com",
     *							path: "/",
     *							secure: true,
     *							expires:  Wednesday, 09-Nov-99 23:12:40 GMT
     *						});
     *	return cookie string like "SSID=AHOkKrqp7_awIDQ2J;domain=**;expires=**"
     * @param name the cookie name you want to generate
     * @param subFieldsObj an object contains each value of the cookie
     * @param options the options of the cookie. i.e path, domain, secure, expires.
     * @param cb
     */
    createCustCookie : function (name, subFieldsObj, options, cb) {
        if (!Y.Lang.isFunction(cb)) {
            throw Error(ERRORMSG.WRONG_PARAMETER_CALLBACK);
        }
        if ((Y.Lang.isUndefined(subFieldsObj))) {
            cb(new Error(ERRORMSG.MISSING_PARAMETER_VALUE));
            return;
        }
        if (!Y.Lang.isObject(subFieldsObj)) {
            cb(new Error(subFieldsObj + ERRORMSG.INVALID_OBJECT));
            return;
        }
        if ((Y.Lang.isUndefined(name))) {
            cb(new Error(ERRORMSG.MISSING_PARAMETER_NAME));
            return;
        }
        var self = this, equalChar, separator, value, error, expires, path, domain, k, v;
        if (self._validateCookieName(name)) {
            equalChar = self._getEqualChar();
            separator = self._getSeparator();
            value = name + equalChar;
            error = null;
            for (k in subFieldsObj) {
                if (subFieldsObj.hasOwnProperty(k)) {
                    v = subFieldsObj[k];
                    error = self._validateCookieName(k) ? error : true;
                    if (v !== "") {
                        error = self._validateCookieSpec(v) ? error : true;
                    }
                    value = value + k + equalChar + v + separator;
                }
            }

            if (error) {
                cb(new Error(ERRORMSG.INVALID_SUBCOOKIE));
            } else {
                //trip off the last &
                value = value.slice(0, value.length - 1);
                options = options || {};
                expires = options.expires;
                path = options.path;
                domain = options.domain;
                if (Y.Lang.isObject(options)) {
                    for (k in options) {
                        if (options.hasOwnProperty(k)) {
                            v = options[k];
                            var lowerKey = k.toLowerCase();
                            if ((lowerKey !== "domain") && (lowerKey !== "path") && (lowerKey !== "secure") && (lowerKey !== "expires")) {
                                console.log(ERRORMSG.UNSUPPORTED_OPTION + k, "warn");
                                error = true;
                            }
                        }
                    }

                    if (error) {
                        cb(new Error(ERRORMSG.UNSUPPORTED_OPTION));
                    } else {
                        //expiration date
                        if (expires instanceof Date) {
                            value += "; expires=" + expires.toUTCString();
                        }
                        //path
                        if (Y.Lang.isString(path) && path !== "") {
                            value += "; path=" + path;
                        }
                        //domain
                        if (Y.Lang.isString(domain) && domain !== "") {
                            value += "; domain=" + domain;
                        }
                        //secure
                        if (options.secure === true) {
                            value += "; secure";
                        }
                        cb(null, value);
                    }
                } else {
                    cb(new Error("option is expected as an object."));
                }
            }
        } else {
            cb(new Error(ERRORMSG.INVALID_COOKIE_NAME));
        }
    },
    /**
     * validate whether this is a valid cookie name, a cookie name cannot be empty, contains ; or , or ' ',
     *  and it is a string
     * @param {String} name the cookie name or sub cookie name
     * @return {*}
     * @private
     */
    _validateCookieName : function (name) {
        if ((name === "") || (name === null)) {
            console.log("the cookie name(sub cookie name) shoud not be empty or null", "error");
            return false;
        }
        return this._validateCookieSpec(name);
    },
    /**
     *  the NAME=VALUE should be a string, and not contains ; or , or ' '.
     * @method _validateCookieSpec
     * @param {String} field - the field value
     * @private
     */
    _validateCookieSpec : function (field) {
        if (!Y.Lang.isString(field)) {
            console.log("'" + field + "' is not string");
            return false;
        }
        var semiColon = field.search(this._getSemicolon()), comma = field.search(this._getComma()), space = field.search(this._getSpace());
        /**
         * check isString first, else it will fail when user input name like  number 1
         */
        if ((semiColon !== -1) || (comma !== -1) || (space !== -1)) {
            console.log("'" + field + "' Error field, each field should be string and doesn't contain ; or , or space.", "error");
            return false;
        }

        return true;
    },
    /**
     * parse cookie string and return an object, the object would be:
     *{
     *	_f1:"ddesee",
     *	b: "3",
     *	a: "8q",
     *}
     * @param value  - a string like "ddesee&b=3&a=8q"
     * @param cb
     * @private
     */
    _parseCookieString : function (value, cb) {
        var separator = this._getSeparator(), equalChar = this._getEqualChar(), text = {}, subFieldsArray = value.split(separator);
        for (var i = 0; i < subFieldsArray.length; i++) {
            var subField = subFieldsArray[i], element = subField.split(equalChar);
            if (element.length > 2) {
                cb(new Error(ERRORMSG.INVALID_COOKIE_VALUE + "[" + value + "]"));
                return;
            }
            if (element.length === 1 && i === 0) {
                //has the subfield, but it is the first field.
                text._f1 = element[0];
            } else {
                text[element[0]] = element[1];
            }
        }

        //check whether input is a valid cookie
        var error = null, v, k, self = this;
        for (k in text) {
            if (text.hasOwnProperty(k)) {
                v = text[k];
                error = self._validateCookieName(k) ? error : true;
                if (!error && v !== "") {
                    error = self._validateCookieSpec(v) ? error : true;
                }
            }
        }

        if (error) {
            cb(new Error(ERRORMSG.INVALID_COOKIE_VALUE));
            return;
        } else {
            cb(null, text);
        }
    },
    /**
     * parse cookie object and return an cookie string.
     * @param cookieObj - e.g. {
     *  _f1:"bsse",
     *  b: "3",
     *  a: "8q",
     * }
     * @param cb
     * @private
     */
    _parseCookieObjToString : function (cookieObj, cb) {
        var separator = this._getSeparator(), equalChar = this._getEqualChar(), text = "", begin = "", v, k;
        for (k in cookieObj) {
            if (cookieObj.hasOwnProperty(k)) {
                v = cookieObj[k];
                if (k === "_f1") {
                    begin = v + separator;
                } else {
                    text = text + k + equalChar + v + separator;
                }
            }
        }

        text = begin + text;
        // trip off the last separator
        text = text.slice(0, text.length - separator.length);

        cb(null, text);
    },
    /**
     * delete a field or several fields in the cookie value, if all the sub fields are deleted,
     * then set the cookie expire, if the field is not in the cookie, warn and leave it,
     * return the modified cookie string.
     * @example
     *
     * deleteSubCookie('bsse&b=3&a=8q',['b','a']);
     * @param value - a cookie string like "bsse&b=3&a=8q"
     * @param subFieldsArray - an array contains all the subfield' names
     * @param cb
     */
    deleteSubCookie : function(value, subFieldsArray, cb) {
        if (!Y.Lang.isFunction(cb)) {
            throw Error(ERRORMSG.WRONG_PARAMETER_CALLBACK);
        }

        if (Y.Lang.isUndefined(value) || value === "") {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_COOKIEVALUE));
            return;
        }
        if (!Y.Lang.isArray(subFieldsArray)) {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_SUBFIELDS_ARRAY));
            return;
        }

        var self = this;

        this._parseCookieString(value, function (err, cookieObj) {
            if (err) {
                cb(err);
            } else {
                for (var i = 0; i < subFieldsArray.length; i++) {
                    if (Y.Lang.isUndefined(cookieObj[subFieldsArray[i]])) {
                        console.log("No subfield '" + subFieldsArray[i] + "' found in the cookie", "warn");
                    } else {
                        //remove the item in the cookieObj
                        delete cookieObj[subFieldsArray[i]];
                    }
                }
                self._parseCookieObjToString(cookieObj, cb);
            }
        });
    },
    /**
     * Add a sub cookie field to the existing cookie string
     * @param value - a cookie string like "ssssx&b=3&a=8q"
     * @param subFieldsObj - an object includes all the new added field information, examples are:
     * {
     *   s: "9j"
     *   d: "asdfdsdfa"
     * }
     * return the modified cookie string
     * @param cb
     */
    addSubCookie : function (value, subFieldsObj, cb) {
        if (!Y.Lang.isFunction(cb)) {
            throw Error(ERRORMSG.WRONG_PARAMETER_CALLBACK);
        }
        if (Y.Lang.isUndefined(value) || value === "") {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_COOKIEVALUE));
        } else if (!Y.Lang.isObject(subFieldsObj)) {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_SUBFIELDS_OBJECT));
        } else {
            var self = this;
            this._parseCookieString(value, function (err, cookieObj) {
                if (err) {
                    cb(err);
                } else {
                    var error = false, v, k;
                    for (k in subFieldsObj) {
                        if (subFieldsObj.hasOwnProperty(k)) {
                            v = subFieldsObj[k];
                            if (!self._validateCookieSpec(v) || !self._validateCookieName(k)) {
                                error = true;
                            }
                            //check whether the subfield has existed
                            if (!Y.Lang.isUndefined(cookieObj[k])) {
                                console.log("the subfield '" + k + "' has existed, new value '" + v + "' will replace the old one: " + cookieObj[k], "warn");
                            }
                            cookieObj[k] = v;
                        }
                    }


                    if (error) {
                        cb(new Error("invalid cookie value"));
                    } else {
                        self._parseCookieObjToString(cookieObj, cb);
                    }
                }
            });
        }
    },
    /**
     * modify each field of the cookie if the field exist, otherwise warn the user and leave it be.
     *
     * @param value - cookie string
     * @param subFieldsObj - an object includes all the new added field information, examples are:
     * {
     *   s: "9j"
     *   d: "asdfdsdfa"
     * }
     * @param cb
     */
    modifyCookie : function (value, subFieldsObj, cb) {
        var self = this, error = null;
        if (!Y.Lang.isFunction(cb)) {
            throw new Error(ERRORMSG.WRONG_PARAMETER_CALLBACK);
        }

        if (Y.Lang.isUndefined(value) || value === "") {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_COOKIEVALUE));
            return;
        }
        if (!Y.Lang.isObject(subFieldsObj)) {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_SUBFIELDS_OBJECT));
            return;
        }
        self._parseCookieString(value, function (err, cookieObj) {
            if (!err) {
                var k, v;
                for (k in subFieldsObj) {
                    if (subFieldsObj.hasOwnProperty(k)) {
                        v = subFieldsObj[k];
                        if (!(self._validateCookieName(k)) || (!self._validateCookieSpec(v))) {
                            error = new Error(ERRORMSG.INVALID_SUBCOOKIE);
                        }
                        if (Y.Lang.isUndefined(cookieObj[k])) {
                            error = new Error("try to modify a field doesn't exist");
                        } else {
                            cookieObj[k] = v;
                        }
                    }
                }

                if (!error) {
                    self._parseCookieObjToString(cookieObj, cb);
                } else {
                    cb(error, value);
                }
            } else {
                cb(err, value);
            }
        });

    },
    /**
     * append a cookie in the existing cookiejar
     * @param cookiejar - the existing cookiejar
     * @param name - the cookie name
     * @param value - the cookie string value
     * @param cb - a callback to return the error and modified cookie string
     */
    appendCookieInCookiejar : function (cookiejar, name, value, cb) {
        if (!(Y.Lang.isString(cookiejar) && Y.Lang.isString(name) && Y.Lang.isString(value) && Y.Lang.isFunction(cb))) {
            throw new Error(ERRORMSG.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}");
        }

        var cookieValue = value, self = this;

        //this is the client side
        if (!_isServer()) {
            var n = value.indexOf(";");
            cookieValue = value.slice(0, n);
        }

        if ((self._validateCookieName(name)) && (self._validateCookieSpec(cookieValue))) {
            self.getCookieInCookiejar(cookiejar, name, function (err, cookieArray) {
                if (!err) {
                    cb(new Error(ERRORMSG.EXISTING_COOKIE + name));
                } else {
                    if (_isServer()) {
                        cb(null, cookiejar + "; " + name + "=" + value);
                    } else {
                        window.document.cookie = name + "=" + value;
                        cb(null, window.document.cookie);
                    }
                }
            });
        } else {
            cb(new Error(ERRORMSG.INVALID_COOKIE_NAME + "or " + ERRORMSG.INVALID_COOKIE_VALUE));
        }
    },
    /**
     * modify a existing cookie in the cookie jar
     * @param cookiejar - the existing cookiejar
     * @param name - the existing cookie name
     * @param value - the cookie value
     * @param cb - a callback to return the error and the modified cookie string
     */
    modifyCookieInCookiejar : function (cookiejar, name, value, cb) {
        var cookieValue = value, self = this;
        if (!(Y.Lang.isString(cookiejar) && Y.Lang.isString(name) && Y.Lang.isString(value) && Y.Lang.isFunction(cb))) {
            throw new Error(ERRORMSG.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, value {String}, cb {Function}");
        }

        //this is the client side
        if (!_isServer()) {
            var n = value.indexOf(";");
            cookieValue = value.slice(0, n);
        }
        if (self._validateCookieSpec(cookieValue)) {

            //check whether the cookie has existed in the cookiejar
            self.getCookieInCookiejar(cookiejar, name, function (err, cookieArray) {

                if (!err) {
                    var newCookiejar = cookiejar;
                    for (var i = 0; i < cookieArray.length; i++) {
                        if (_isServer()) {
                            newCookiejar = cookiejar.replace(cookieArray[i], name + "=" + value);
                            cookiejar = newCookiejar;
                        } else {
                            window.document.cookie =  name + "=" + value;
                            newCookiejar = window.document.cookie;
                        }
                    }
                    cb(null, newCookiejar);
                } else {
                    cb(err);
                }
            });
        } else {
            cb(new Error(ERRORMSG.INVALID_COOKIE_VALUE + value));
        }
    },
    /**
     * delete a certain cookie in the cookie jar
     * @param cookiejar -  a existing cookiejar string
     * @param name - the cookie you want to delete
     * @param cb - a callback to return the error or modified cookie jar
     */
    deleteCookieInCookiejar : function (cookiejar, name, cb) {
        var self = this;
        if (!(Y.Lang.isString(cookiejar) && Y.Lang.isString(name) && Y.Lang.isFunction(cb))) {
            throw new Error(ERRORMSG.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}");
        }
        self.getCookieInCookiejar(cookiejar, name, function (err, cookieArray) {
            if (!err) {
                for (var i = 0; i < cookieArray.length; i++) {
                    var cookieString = cookieArray[i];
                    if (_isServer()) {
                        cookiejar = cookiejar.trim();
                        var newCookiejar = cookiejar.replace(cookieString, "");
                        newCookiejar = newCookiejar.trim();
                        var n = newCookiejar.search(";");

                        if (n === 0) {
                            //delete the first cookie
                            cookiejar = newCookiejar.slice(1, newCookiejar.length);
                        } else if (newCookiejar.slice(newCookiejar.length - 1, newCookiejar.length) === ";") {
                            //delete the last cookie
                            cookiejar = newCookiejar.slice(0, newCookiejar.length - 1);
                        } else {
                            cookiejar = cookiejar.replace(cookieString + ";", "");
                        }
                    } else {
                        //delete the cookie in the cookiejar
                        var expireDate = new Date(0);
                        window.document.cookie = name + "=;expires=" + expireDate;
                        cookiejar = window.document.cookie;
                    }
                }
                cb(null, cookiejar);
            } else {
                cb(new Error(ERRORMSG.NONEXISTING_COOKIE + name), cookiejar);
            }
        });
    },
    /**
     * extract the whole cookie from the cookiejar
     * @param cookiejar - a cookie jar
     * @param name -  a cookie name
     * @param cb -  a callback to return the error and extracted cookie string
     */
    getCookieInCookiejar : function (cookiejar, name, cb) {
        var self = this;
        if (!(Y.Lang.isString(cookiejar) && Y.Lang.isString(name) && Y.Lang.isFunction(cb))) {
            throw new Error(ERRORMSG.INVALID_PARAMETER + "\ncookiejar {String}, name {String}, cb {Function}");
        }
        //check whether the cookie has existed in the cookiejar
        var patt = new RegExp("^" + name + "="), one, cookieArray = cookiejar.split(";"), matchedCookie = [];

        for (var i = 0; i < cookieArray.length; i++) {
            one = cookieArray[i].trim();
            if (one.match(patt)) {
                matchedCookie.push(one);
            }
        }
        if (matchedCookie.length > 0) {
            cb(null, matchedCookie);
        } else {
            cb(new Error(ERRORMSG.NONEXISTING_COOKIE + name));
        }
    },
    /**
     * Get cookies from "set-cookie" fields in response headers and return the cookies object with key-value pair.
     * e.g. for cookie  'set-cookie: X=v=1&n=hhhhress; path=/; domain=.domain.com'
     *      to get X cookie: cookies["X"] , value is 'v=1&n=hhhhress', does not contain path, domain and other options
     *
     * usage:
     * var responseCookies;
     * YUI.io(url, {
     *              method: 'POST',
     *              headers: headers,
     *              on: {
     *                  complete: function (id, response) {
     *                      responseCookies = cookieUtil.getCookiesFromHeader(response);
     *                      //get X cookie;
     *                      var Xcookie=responseCookies["X"];
     *                  }
     *              }
     *          });
     * @param response - response http response object after send request
     * @param cb - return cookies object with cookie name as key, cookie value as value.
     */
    getCookiesFromHeader : function (response, cb) {
        var cookies = {};
        if (Y.Lang.isUndefined(response) || response === null || !Y.Lang.isObject(response)) {
            cb(new Error(ERRORMSG.ILLEGAL_RESPONSE));
        } else {
            console.log('response headers is [' + response.getAllResponseHeaders() + "]");
            var key, value, headers = response.headers;
            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    value = headers[key];
                    if (key.toLowerCase() === "set-cookie") {
                        // parse cookies
                        if (!Y.Lang.isArray(value)) {
                            value = [value];
                        }
                        for (var j = 0; j < value.length; j++) {
                            var one = value[j];
                            // example: X=a=1&m=xxes33; path=/; domain=.xx.com
                            var cookieValue = one.split(";")[0], i = cookieValue.indexOf("=");

                            if (i !== -1) {
                                var v = cookieValue.slice(i + 1);
                                cookies[cookieValue.slice(0, i)] = v;
                            } else {
                                console.log("invalid cookie: " + one, "warn");
                            }
                        }
                    }
                }
            }

            if (Y.Object.isEmpty(cookies)) {
                cb(new Error(ERRORMSG.NO_COOKIE_FROM_SERVER));
            } else {
                cb(null, cookies);
            }
        }
    },
    /**
     * set cookiejar to http request header, e.g. set "AO=o=1&s=1&dnt=1; X=fa683mt88i5me&b=xxx" to header.
     * after set cookiejar to header, there is 'Cookie' header in request headers, e.g.
     * " Cookie: AO=o=1&s=1&dnt=1; X=fa683mt88i5me&b=xxx ".
     *
     * this is different for client and server side
     * for client: set cookiejar to window.document.cookie, then browser will send the cookie in header
     * for server: set cookiejar to 'Cookie' header in http request.
     *
     * @param cookiejar - a cookiejar string which can set to http header directly.e.g. AO=o=1&s=1&dnt=1; X=fa683mt88i5me&b=xxx
     * @param headers - current headers object, required if send the http request from nodejs, usage:
     *  YUI.io(url, {
     *              method: 'POST',
     *              headers: headers,
     *              on: {
     *                  complete: function(id, response) {
     *                      // validate response
     *                  }
     *              }
     *          }
     *
     * @param cb
     */
    setCookiejarToHeader : function (cookiejar, headers, cb) {
        if (Y.Lang.isUndefined(cookiejar) || cookiejar === null || cookiejar.length === 0) {
            console.log("cookiejar is undefined, did not set cookie to header");
            cb(new Error(ERRORMSG.INVALID_COOKIEJAR));
        } else if (!_isServer()) {
            // if this is client side
            window.document.cookie = cookiejar;
            cb(null);
        } else {
            // if this is not server side
            if (Y.Lang.isUndefined(headers)) {
                console.log("headers is undefined");
                cb(new Error(ERRORMSG.UNDEFINED_HEADER));
            } else {
                headers.Cookie = cookiejar;
                cb(null, headers);
            }
        }
    },
    /**
     * Both cookie name and value should not contain any semi-colon, comma or white space characters.
     * this method creates invalid format cookie by adding semi-colon, comma or white space characters in the cookie name and value,
     * @param cookiejar - valid format cookiejar which does not contain semi-colon, comma or white space
     * e.g. 'X=bnas=0; H=1; K=a=nJN0&b=Jhio'
     * @param cb - return invalidCookiejar invalid format cookiejar which contains semi-colon, comma or whitespace
     * e.g. 'X,=bnas=0; H=1; K=a=nJN0&b=Jhio; '
     */
    generateInvalidFormatCookie : function (cookiejar, cb) {
        var semiColon = this._getSemicolon(), comma = this._getComma(), space = this._getSpace();

        if (!Y.Lang.isUndefined(cookiejar) && Y.Lang.isString(cookiejar)) {
            cookiejar = semiColon + cookiejar + comma + space;
            cb(null, cookiejar);
        } else {
            cb(new Error(ERRORMSG.INVALID_COOKIEJAR));
        }
    },
    /**
     *  parse cookies object to cookiejar
     * @param cookiesObj - a object including cookies from "set-cookie" in http response header with key-value pair only , does not contain info about path, domain, expire etc.,
     *                 , e.g. cookies["X"]="k=1&H=ab3"
     * @param cb - return cookiejar, a String which can be used in http request 'Cookie' header and send out.
     */
    parseCookiesObjToCookiejar : function (cookiesObj, cb) {
        var separator = this._getSeparator(), equalChar = this._getEqualChar(), cookiejar, self = this;
        if (Y.Lang.isUndefined(cookiesObj) || !Y.Lang.isObject(cookiesObj) || Y.Object.isEmpty(cookiesObj)) {
            cb(new Error(ERRORMSG.WRONG_PARAMETER_COOKIES_OBJECT));
        } else {
            var error = false, key, value;
            for (key in cookiesObj) {
                if (cookiesObj.hasOwnProperty(key)) {
                    value = cookiesObj[key];
                    if (self._validateCookieName(key) && self._validateCookieSpec(value)) {
                        cookiejar = cookiejar + key + equalChar + value + separator;
                    } else {
                        error = true;
                    }
                }
            }
            if (error) {
                cb(new Error(ERRORMSG.INVALID_COOKIE_VALUE));
            } else {
                cookiejar = cookiejar.slice(0, cookiejar.length - separator.length);
                cb(null, cookiejar);
            }
        }

    }
}
    /**
     * whether this is run on the server side
     * @return {Boolean}  return true if it is server side, otherwise it is client side
     * @private
     */
    function _isServer() {
        if (typeof process === 'object') {
            if (process.versions && process.versions.node) {
                return true;
            }
        } else {
            return false;
        }
    };
    Y.Arrow.CookieUtil=CookieUtil;

}, "0.1", { requires:["martini-test-function-common"]});