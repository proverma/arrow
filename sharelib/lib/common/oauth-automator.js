/*jslint nomen: true, plusplus: true */
/*global YUI: true, require: true */

/*
 * Copyright (c) 2013 Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/**
 * Yahoo OAuth (1.0A) test automation helper module.
 * 
 * @module oauth-automator
 * 
 * Generate authorization credentials which will be passed to the user
 * given callback function. If the 'authType' was set to "header", the 
 * callback function will be invoked with a 'headers' object. User will 
 * use the auth headers when they request URIs that are protected by 
 * OAuth.
 *
 * @example
 * 
 * var url = "http://..."; // test url protected by oauth
 * var oauth = new Y.OAuthAutomator("/path/to/oauth-configuration.json");
 * oauth.generateOAuth(function (err, headers) {
 *     if (!err) {
 *         // user headers object which contains auth credentials.
 *         Y.io(url, {
 *              method: 'POST',
 *              headers: headers,
 *              on: {
 *                  complete: function (id, response) {
 *                      // validate response
 *                  }
 *              }
 *          }
 *     }
 * }
 * 
 * Attributes for external type of generateOAuth() :
 *   oauthType - "external"(default). Keep "internal" for Yahoo! internal use
 *   needUserCred(boolean) - true(default)
 *   password - Required if needUserCred is true
 *   username - Required if needUserCred is true
 *   consumerKey - (Required)
 *   consumerSecret - (Required)
 *   wsUrl - (Required)
 *   wsMethod - "GET"(default)
 *   wsQueryParams
 *   externalOAuthScope
 *   signatureMethod - "HMAC-SHA1"(default)
 *   oauthMode - "header"(default) Only default is supported as of now.
 *   oauthVersion - "1.0"(default)
 *   oauthProvider - "yahoo"(default)
 * 
 */

YUI.add('oauth-automator', function (Y, NAME) {

   // global user cookies and scrumb caches
    Y.namespace("Arrow");

    if (!Y._userCookies) {
        /**
         * example:
         * {
         *    username: {
         *        cookies: {
         *            "name": "value"
         *        },
         *        scrumb: "...",
         *    }
         * }
         */
        Y._userCookies = {};
    }

    var fs = require('fs'),
        util = require('util'),
        xml2js = require('xml2js'),

        select = require('cheerio-select'),
        parse = require('cheerio').parse,
        OAuth = require('oauth').OAuth,

        EXTERNAL = 'external',
        OAUTH_MODE_HEADER = 'header',
        OAUTH_MODE_URL = 'url', // not supported.

        // oauth service provider names
        YAHOO = "yahoo";

    /**
     * OAuthAutomator class.
     * 
     * @class OAuthAutomator
     * @constructor
     * @param config {String | Object} [config] A confihuration object.  
     *  If a string type is given, it should be the path of the configuration 
     *  file(json) otherwise should an object with configuration elements. 
     *  
     *  Valid configuration object properties:
     *      
     *      @param {String} [config.configPath] A file path of configuration 
     *          file. If all configurations are contained in the file, the file
     *          path can be directly passed to this constructor instead of placing
     *          it to this configuation object. If the same property is also 
     *          given in this configuration object, the one in the file will be
     *          overriden. 
     *      @param {Number} [config.timeoutForTokenGeneration] 29(default)
     *      @param {String} [config.wsUrl]
     *      @param {String} [config.wsMethod] "GET"(default)
     *      @param {String} [config.wsQueryParams]
     *      @param {String} [config.signatureMethod] "HMAC-SHA1"(default)
     *      @param {String} [config.oauthProvider] "yahoo"(default)
     *      @param {String} [config.yahooAuthVersion] "v1" or "v2"(default)                
     *      @param {String} [config.oauthType] "external"(default), 
     *          keep "internal" for Yahoo! internal use.
     *      @param {String} [config.externalOAuthScope] Used to specify external
     *          OAuth scope. 
     *      @param {String} [config.oauthServer] An OAuth provider URL
     *      @param {String} [config.oauthVersion] Either "1.0" or "1.1". Default
     *          is "1.0".
     *      @param {String} [config.oauthMode] Only "header"(default) is 
     *          available. The "url" is broken.
     *      @param {String} [config.consumerKey] OAuth consumer key
     *      @param {String} [config.consumerSecret] OAuth consumer secret
     *      @param {String} [config.appId] OAuth application id.
     *      @param {String} [config.ExtAllConsumerKey] This is an example property 
     *          name for the "external" type when "externalOAuthScope" is given 
     *          and its value is "All". Ext+"{externalOAuthScope}"Consumer[AppId | 
     *          Key | Secret] will be used for the given external scope. 
     *      @param {String} [config.ExtAllConsumerSecret] This is an example property 
     *          name for the "external" type when "externalOAuthScope" is given 
     *          and its value is "All". Ext+"{externalOAuthScope}"Consumer[AppId | 
     *          Key | Secret] will be used for the given external scope.
     *      @param {String} [config.ExtAllConsumerAppId] This is an example property 
     *          name for the "external" type when "externalOAuthScope" is given 
     *          and its value is "All". Ext+"{externalOAuthScope}"Consumer[AppId | 
     *          Key | Secret] will be used for the given external scope.
     *      @param {Boolean} [config.needUserCred] true(default) or false.
     *          If true, 3-legged protocol will be used.
     *      @param {String} [config.username] Username. Required if needUserCred
     *          is set to "true".
     *      @param {String} [config.password] Password. Required if needUserCred
     *          is set to "true".
     *
     */
    function OAuthAutomator() {
        OAuthAutomator.superclass.constructor.apply(this, arguments);
    }

    Y.extend(OAuthAutomator, Y.Base, {

        /**
         * Init lifecycle implementation.
         * 
         * @method initializer
         * @param {Object} config Configuration object.
         * @protected
         */
        initializer: function (config) {
            if (Y.Lang.isString(config)) {
                config = {
                    configPath: config
                };
            } else {
                config = config || {};
            }

            // this.defaultConfig is the unmodified default configuration when 
            // this object was created and not the current. 
            // Use super class Base's attributes for the current.
            this.defaultConfig = Y.Object(config);
            this._init(config);
        },

        /**
         * Destroy lifecycle method.
         * 
         * @method destructor
         * @protected
         */
        destructor: function () {
            this.defaultConfig = null;
        },

        /**
         * Load the given configuration and update the this class attributes.
         * 
         * @method _init
         * @param config {String | Object} [config] A confihuration object.  
         *  If a string type is given, it should be the path of the configuration 
         *  file(json) otherwise should an object with configuration elements.
         * @private        
         */
        _init: function (config) {
            // try to load defaults from the external JSON file if given
            if (config.configPath) {
                var contents = fs.readFileSync(config.configPath, "utf-8");
                try {
                    Y.each(JSON.parse(contents), function (value, key) {
                        this.set(key, value);
                    }, this);

                } catch (e) {
                    throw new Error('Invalid configuration file: ' + config.configPath);
                }

                delete config.configPath;
            }

            // then load configurations given the code.
            Y.each(config, function (value, key) {
                this.set(key, value);
            }, this);

            if ((this.get("oauthType") === EXTERNAL) && this.get("externalOAuthScope")) {
                this._handleExternalScopeGiven();
            }
        },

        /**
         * Adjust consumerKey, consumerSecret and appId if external scope is set.
         * They will be replaced with these attributes.
         *
         * Ext{externalOAuthScope}ConsumerKey
         * Ext{externalOAuthScope}ConsumerSecret
         * Ext{externalOAuthScope}ConsumerAppId
         */
        _handleExternalScopeGiven: function () {
            var base = "Ext" + this.get("externalOAuthScope"),
                bck = this.get(base + "ConsumerKey"),
                bcs = this.get(base + "ConsumerSecret"),
                bca = this.get(base + "ConsumerAppId");

            if (bck === undefined || bcs === undefined) {
                Y.log("Expected these attrs: " + base + "ConsumerKey" + "/" + base + "ConsumerSecret", "warn", NAME);
            }

            if (bck !== undefined) {
                this.set("consumerKey", bck);
            }
            if (bcs !== undefined) {
                this.set("consumerSecret", bcs);
            }
            if (bca !== undefined) {
                this.set("appId", bca);
            }
        },

        /**
         * Use this method to clear mess from the prior generateOAuth() method.
         * It is called in the beginning of generateOAuth() method.
         */
        _clear: function () {},

        /**
         * 
         * @method generateOAuth
         * @param {Object} attrs (Optional) An object with configurations(attributes).
         *  If this object is given, attributes determined in the constructor
         *  will be overriden. The updated attributes will remain even after
         *  this method is completed. All attributes except 'configPath' are
         *  allowed here. 
         * @param {Function} [cb] A callback function to be called once 
         *  authrization credentials are generated.
         *      @param {Error} [cb.err] An error object if auth credential 
         *          generation is failed.
         *      @param {Object} [cb.headers] An object with generated auth 
         *          headers. Example: {"Yahoo-App-Auth": "...", "Authorization": 
         *          "..."}
         *      @param {Object} [cb.token] An object with access token data for
         *          the external type. The access token object has 5 properties;
         *          oauthToken, oauthTokenSecret, oauthTokenExpires,
         *          oauthTokenSessionHandle, oauthTokenSessionHandleExpires.
         *          See the OAuth spec for details.
         */
        generateOAuth: function (attrs, cb) {
            var type,
            wsUrl,
            invalidate = false,
                checkForInvalidate = {
                    consumerKey: 1,
                    consumerSecret: 1,
                    oauthVersion: 1,
                    signatureMethod: 1,
                    oauthProvider: 1,
                    yahooAuthVersion: 1,
                    RequestTokenUrl: 1,
                    AccessTokenUrl: 1
                };
            Y.log("==========\nGenerating Auth Headers...\n==========", "info");
            this._clear();

            if (!Y.Lang.isFunction(attrs)) {
                if (Y.Lang.isObject(attrs)) {
                    // then update configurations.
                    Y.each(attrs, function (value, key) {
                        if (key !== "configPath") {
                            this.set(key, value);
                            if (checkForInvalidate[key] && !invalidate) {
                                invalidate = true;
                            }
                        }
                    }, this);

                    // adjust consumerKey, consumerSecret and appId if external 
                    // scope is set
                    if ((this.get("oauthType") === EXTERNAL) && this.get("externalOAuthScope")) {
                        this._handleExternalScopeGiven();
                    }
                } else {
                    cb(new Error("The first param should be either attributes object or callback function"));
                }
            } else if (Y.Lang.isFunction(attrs)) {
                cb = attrs;
            }

            if (!cb || !Y.Lang.isFunction(cb)) {
                throw new Error("callback function parameter is required");
            }

            if (!this.get("consumerKey")) {
                cb(new Error("consumerKey attribute is required."));
            }

            type = this.get('oauthType');
            Y.log("Detected OAuth Type: " + type, "info");
            Y.log("Detected Consumer Key: " + this.get("consumerKey"), "info");

            if (type === EXTERNAL) {
                Y.log("Detected needUserCred: " + this.get("needUserCred"));
                Y.log("Detected OAuth Provider: " + this.get("oauthProvider"));

                // check if oa should be reconstructed
                if (!this.oa || invalidate) {
                    this.oa = this._createOAuthClient();
                }

                // wsUrl is required
                wsUrl = this.get("wsUrl");
                if (!wsUrl) {
                    cb(new Error("A webservice url(wsUrl attribute) that protected by oauth should be given to generate a signature."));
                }

                if (this.get("needUserCred") && (!this.get("username") || !this.get("password"))) {
                    cb(new Error("Credential(username/password) are required when needUserCred is true."));
                }

                if (this.get("oauthProvider") !== YAHOO) {
                    // make sure their oauth urls are given.
                    if (this.get("RequestTokenUrl") === undefined || this.get("AccessTokenUrl") === undefined) {
                        cb(new Error("Non Yahoo Oauth provdier is enabled but their oauth URLs are not given."));
                    }
                }

                this._generateExternalOAuth(cb);
            } else {
                cb(new Error('Invalid oauth type: ' + type));
            }
        },


        /**
         * A private function to be called for the "external" type.
         * @method _generateExternalOAuth
         * @param {Function} [cb] A callback function to be called once 
         *  authrization credentials are generated.
         * @private
         */
        _generateExternalOAuth: function (cb) {
            var headers = {},
            token = {},
            tokenGenerateTimeout = 1,
                maxTry = 1,
                self = this,
                tid,
                authorizationHeader;

            if (this.get("needUserCred") === true) {
                tokenGenerateTimeout = 1000;
                maxTry = this.get("timeoutForTokenGeneration") || 29;

                /**
                 * Ideally this method should be responsible to get the access token
                 * of either 2-legged or 3-legged as described in
                 * http://blog.nerdbank.net/2011/06/what-is-2-legged-oauth.html 
                 * 
                 * However it actually handles only 3-legged as it appears Yahoo
                 * doesn't have true 2-legged. 
                 * What described as 2-legged is actually 0-legged according
                 * to the above url. This 0-legged(or 2-legged by Yahoo) is done
                 * by skipping this method (set needUserCred=false).
                 */

                this["_generateExternalOAuthToken"](function (err, otoken) {
                    if (!err) {
                        token = otoken;
                    } else {
                        cb(err);
                    }
                });
            }

            tid = setInterval(function () {
                if ((maxTry--) === 0) {
                    clearInterval(tid);
                    if (self.get("needUserCred") === true && (!token.oauthToken || !token.oauthTokenSecret)) {
                        cb(new Error("Timeout: couldn't get the access token."));
                    } else {
                        if (self.get("oauthMode") === OAUTH_MODE_URL) {
                            cb(new Error("OAuth mode: url is not supported"));
                        } else if (self.get("oauthMode") === OAUTH_MODE_HEADER) {
                            authorizationHeader = self._generateExternalOAuthHeader(token);
                            if (authorizationHeader instanceof Error) {
                                cb(authorizationHeader);
                            } else if (!authorizationHeader) {
                                cb(new Error("error: empty auth headers returned"));
                            } else {
                                headers.Authorization = authorizationHeader;
                                Y.log("----------\nExternal Auth Headers:\n----------", "info");
                                Y.log(util.inspect(headers), "info");
                                cb(null, headers, token);
                            }
                        } else {
                            cb(new Error("Invalid mode. Only 'url' or 'header' is allowed: " + self.get("oauthMode")));
                        }
                    }
                } else {
                    if (token.oauthToken && token.oauthTokenSecret) {
                        if (self.get("oauthMode") === OAUTH_MODE_URL) {
                            //this.set('wsUrl', this.get('wsUrl')+'?'+this._generateExternalOAuthHeader(cb));
                            cb(new Error("OAuth mode: url is not supported"));
                        } else if (self.get("oauthMode") === OAUTH_MODE_HEADER) {
                            // only headers supported due to the above bug.

                            authorizationHeader = self._generateExternalOAuthHeader(token);
                            if (authorizationHeader instanceof Error) {
                                cb(authorizationHeader);
                            } else if (!authorizationHeader) {
                                cb(new Error("error: empty auth headers returned"));
                            } else {
                                headers.Authorization = authorizationHeader;
                                Y.log("----------\nExternal Auth Headers:\n----------", "info");
                                Y.log(util.inspect(headers), "info");
                                cb(null, headers, token);
                            }
                        } else {
                            cb(new Error("Invalid mode. Only 'url' or 'header' is allowed: " + self.get("oauthMode")));
                        }
                        clearInterval(tid);
                    }
                }
            }, tokenGenerateTimeout);
        },

        /**
         * A private function to be called for the "external" type.
         * @method _generateExternalOAuthHeader
         * @param {Function} [cb] A callback function to be called once 
         *  authrization credentials are generated.
         * @private
         */
        _generateExternalOAuthHeader: function (token) {
            var accessToken = token.oauthToken,
                accessTokenSecret = token.oauthTokenSecret,
                wsUrl,
                wsMethod,
                wsQueryParams,
                orderedParameters;

            wsUrl = this.get("wsUrl");
            if (!wsUrl) {
                return new Error("webservice url protected by the oauth should be given to generate a signature.");
            }

            wsMethod = this.get("wsMethod") || "GET";
            wsQueryParams = this.get("wsQueryParams") || null;

            orderedParameters = this.oa._prepareParameters(accessToken, accessTokenSecret, wsMethod, wsUrl, wsQueryParams);
            return this.oa._buildAuthorizationHeaders(orderedParameters);
        },

        /**
         * A private function to be called for the "external" type.
         * @method _generateExternalOAuthToken
         * @param {Function} [cb] A callback function to be called once 
         *  authrization credentials are generated.
         * @private
         */
        _generateExternalOAuthToken: function (cb) {
            var username = this.get("username"),
                password = this.get("password"),
                token = {},
                self = this,

                provider = this.get("oauthProvider") || YAHOO,
                yAuthVersion,
                requestAuthUrl;
            Y.log("==========\nGenerating External Access Token\n==========", "info");

            // get request token
            this.oa.getOAuthRequestToken({}, function (err, oauthToken, oauthTokenSecret, results) {
                if (!err) {
                    if (!oauthToken || !oauthTokenSecret) {
                        cb(new Error("invalid request token received: " + oauthToken + "/" + oauthTokenSecret));
                    }
                    //console.log('oauth_token: ' + oauthToken);              // log sample: qxbdyzy
                    //console.log('oauth_token_secret: ' + oauthTokenSecret); // log sample: 6f2b84f9cd7829fe6a68f41f41e9868a094f5ad2
                    //console.log('request token results: ' + util.inspect(results));
                    /* log sample:   
                    { oauth_expires_in: '3600',
                    xoauth_request_auth_url: 'https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=qxbdyzy',
                    oauth_callback_confirmed: 'true' 
                    }*/

                    if (results && results.xoauth_request_auth_url) {
                        requestAuthUrl = results.xoauth_request_auth_url;
                    } else {
                        // just in case "xoauth_request_auth_url" wasn't passed.
                        if (provider === YAHOO) {
                            yAuthVersion = self.get("yahooAuthVersion");
                            if (!self.get(yAuthVersion + "RequestAuthUrl")) {
                                cb(new Error("RequestAuthUrl wasn't given for the Yahoo auth version, " + self.get("yahooAuthVersion")));
                            }
                            requestAuthUrl = self.get(yAuthVersion + "RequestAuthUrl") + oauthToken;
                        } else {
                            if (!self.get("RequestAuthUrl")) {
                                cb(new Error("RequestAuthUrl wasn't given for the " + provider));
                            }
                            requestAuthUrl = self.get("RequestAuthUrl") + oauthToken;
                        }
                    }

                    //TODO: if this script is supposed to be used for non yahoo as well
                    // get the oauth provider name from the configuration and invoke
                    // appropriate getVerifier method per provider. 
                    self._getVerifierForYahoo({
                        url: requestAuthUrl,
                        username: username,
                        password: password
                    },

                    function (err, oauthVerifier) {
                        if (!err) {
                            self.oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier,

                            function (err, oauthToken, oauthTokenSecret, results) {
                                if (!err) {
                                    //console.log('oauth_access_token: ' + oauthToken);
                                    //console.log('oauth_access_token_secret: ' + oauthTokenSecret);
                                    //console.log('access token results: ' + util.inspect(results));
                                    /* log sample:
                                            { oauth_expires_in: '3600',
                                            oauth_session_handle: 'AMcaG1BaPpaE_GfkLsj95RdpciPeuywY1RV7Q3B2E7saF5Xc._4jhqB3SxduU78-',
                                            oauth_authorization_expires_in: '802401803',
                                            xoauth_yahoo_guid: 'H6EBUJTPLBLSRWXUHENXOQTE44'
                                            }*/

                                    token.oauthToken = oauthToken;
                                    token.oauthTokenSecret = oauthTokenSecret;

                                    // it appears the followings(which need for the token renewal)
                                    // is not used in YQL tests. 
                                    token.oauthTokenExpires = results.oauth_expires_in;
                                    token.oauthTokenSessionHandle = results.oauth_session_handle;
                                    var tmp = parseInt(results.oauth_authorization_expires_in, 10);
                                    token.oauthTokenSessionHandleExpires = (new Date()).getTime() + tmp;

                                    Y.log("----------\nOAuth Access Token\n----------", "info");
                                    Y.log(token, "info");
                                    cb(null, token);
                                }
                            });
                        } else {
                            cb(new Error("error in getting the oauth verifier code."));
                        }
                    });

                } else {
                    cb(new Error("error in getting the request token."));
                }
            });
        },

        _getVerifierForYahoo: function (options, cb) {
            var reqAuthUrl = options.url,
                username = options.username,
                password = options.password,
                self = this,

                oauthVerifier,
                vts,
                vt;

            if (!reqAuthUrl || !username || !password) {
                cb(new Error("illegal araguments passed: " + reqAuthUrl + "/" + username + "/" + password));
            }

            Y.io(reqAuthUrl, {
                method: 'GET',
                request: {
                    followAllRedirects: true
                },
                on: {
                    complete: function (id, response) {
                        // response page would be a login page
                        self._submitForm(response.responseText, {
                            css: "#login_form",
                            params: {
                                login: username,
                                passwd: password
                            }
                        }, function (err, response) {
                            if (!err) {
                                self._submitForm(response.responseText, {}, function (err, response) {
                                    if (!err) {
                                        var dom = parse(response.responseText);
                                        vts = select("#shortCode", dom);
                                        if (vts.length !== 1) {
                                            cb(new Error("can't find an element that contains oauth verifier."));
                                        }
                                        vt = vts[0].children;
                                        if (vt.length !== 1) {
                                            cb(new Error("can't find an element that contains oauth verifier."));
                                        }

                                        oauthVerifier = vt[0].data;
                                        Y.log("Detected OAuth Verifier: " + oauthVerifier);
                                        cb(null, oauthVerifier);
                                    } else {
                                        cb(new Error("error in a permission allow submit form"));
                                    }
                                });
                            } else {
                                cb(new Error("error in a login using this credential: " + username + "/" + password));
                            }
                        });
                    },
                    failure: function (id, response) {
                        var status = response.status,
                            sid = parseInt(status, 10);

                        if (sid < 300 || sid > 399) {
                            cb(new Error(response.status + ": error in visting " + reqAuthUrl));
                        }
                    }
                }
            });
        },

        _submitForm: function (page, options, cb) {
            var formCss = options.css || null,
                formParams = options.params || {},
                self = this,

                forms,
                form,
                formUrl,
                params = {},
                inputs,
                dom = parse(page);

            if (formCss) {
                forms = select(formCss, dom);
            } else {
                // use the 1st form in the page
                forms = select("form", dom);
            }

            if (forms.length === 0 || forms.length > 1) {
                cb(new Error("either no form or more than 1 form found."));
            }
            form = forms[0];

            // check the form url
            formUrl = form.attribs.action;
            if (formUrl.search(/^\//) === 0) {
                formUrl = "https://api.login.yahoo.com" + formUrl;
            }

            // prepare params. if there is user given params, add or override
            // existing input params of the form.

            inputs = select("input", form);
            // extract existing ones
            inputs.forEach(function (one) {
                if (one.attribs) {
                    params[one.attribs.name] = one.attribs.value;
                }
            });

            // apply the user given params
            Y.each(formParams, function (value, key) {
                if (!key) {
                    cb(new Error("invalid key was passed"));
                    return;
                }
                params[key] = value;
            });

            // submit the form
            //console.log("params for "+formUrl)
            //console.log(params);
            Y.io(formUrl, {
                method: "POST",
                data: params,
                request: {
                    followAllRedirects: true
                },
                on: {
                    complete: function (id, response) {
                        // TODO: check the response codes
                        cb(null, response);
                    },
                    failure: function (id, response) {
                        var status = response.status,
                            sid = parseInt(status, 10);

                        if (sid < 300 || sid > 399) {
                            cb(new Error(response.status + ": error in submitting a form to " + formUrl));
                        }
                    }
                }
            });
        },

        _createOAuthClient: function () {
            var ckey = this.get("consumerKey"),
                csecret = this.get("consumerSecret"),
                oversion = this.get("oauthVersion") || "1.0",
                smethod = this.get("signatureMethod") || "HMAC-SHA1",
                provider = this.get("oauthProvider") || YAHOO,
                yAuthVersion,
                requestTokenUrl,
                accessTokenUrl;

            if (provider === YAHOO) {
                yAuthVersion = this.get("yahooAuthVersion");

                // now get both request/access urls
                requestTokenUrl = this.get(yAuthVersion + "RequestTokenUrl");
                if (!requestTokenUrl) {
                    throw new Error("RequestTokenUrl wasn't given for Yahoo auth version, " + this.get("yahooAuthVersion"));
                }

                accessTokenUrl = this.get(yAuthVersion + "AccessTokenUrl");
                if (!accessTokenUrl) {
                    throw new Error("AccessTokenUrl wasn't given for Yahoo auth version, " + this.get("yahooAuthVersion"));
                }
            } else {
                if (!this.get("RequestTokenUrl")) {
                    throw new Error("RequestTokenUrl wasn't given for the " + provider);
                }
                requestTokenUrl = this.get("RequestTokenUrl");

                if (!this.get("AccessTokenUrl")) {
                    throw new Error("AccessTokenUrl wasn't given for the " + provider);
                }
                accessTokenUrl = this.get("AccessTokenUrl");
            }

            return new OAuth(requestTokenUrl, accessTokenUrl, ckey, csecret, oversion, undefined, smethod);
        }
    }, {
        NAME: 'OAuthAutomator',
        ATTRS: {
            ///////////////////////////////////////////
            // oauth types(external, internal, ...)
            ///////////////////////////////////////////
            oauthType: { 
                value: EXTERNAL,
                validator: 'isString'
            },

            consumerKey: {
                validator: 'isString'
            },

            needUserCred: {
                value: true,
                validator: 'isBoolean'
            },

            username: {
                validator: 'isString'
            },

            password: {
                validator: 'isString'
            },

            timeoutForTokenGeneration: {
                value: 29,
                validator: 'isNumber'
            },

            consumerSecret: {
                validator: 'isString'
            },

            // The following 3 are used to sign the request
            wsUrl: {
                validator: 'isString',
                getter: function (value) {
                    return encodeURI(value);
                }
            },

            wsMethod: {
                value: "GET",
                validator: 'isString'
            },

            wsQueryParams: {
                validator: 'isString'
            },

            externalOAuthScope: {
                validator: 'isString'
            },

            signatureMethod: {
                value: "HMAC-SHA1",
                validator: 'isString'
            },

            // YAHOO
            // yahoo internal version (both v1/v2 use oauthVersion="1.0")
            yahooAuthVersion: {
                value: "v2",
                validator: 'isString'
            },

            // sort of private, use oauthServer attribute to control this.
            v1RequestTokenUrl: {
                value: "https://api.login.yahoo.com/OAuth/V1/get_request_token",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/OAuth/V1/get_request_token";
                    } else {
                        return value;
                    }
                }
            },

            // sort of private, use oauthServer attribute to control this.
            v2RequestTokenUrl: {
                value: "https://api.login.yahoo.com/oauth/v2/get_request_token",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/oauth/v2/get_request_token";
                    } else {
                        return value;
                    }
                }
            },

            // sort of private, use oauthServer attribute to control this.
            v1AccessTokenUrl: {
                value: "https://api.login.yahoo.com/OAuth/V1/get_access_token",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/OAuth/V1/get_access_token";
                    } else {
                        return value;
                    }
                }
            },

            // sort of private, use oauthServer attribute to control this.
            v2AccessTokenUrl: {
                value: "https://api.login.yahoo.com/oauth/v2/get_token",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/oauth/v2/get_token";
                    } else {
                        return value;
                    }
                }
            },

            // sort of private, use oauthServer attribute to control this.
            v1RequestAuthUrl: {
                value: "https://api.login.yahoo.com/OAuth/V1/request_auth?oauth_token=",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/OAuth/V1/request_auth?oauth_token=";
                    } else {
                        return value;
                    }
                }
            },

            // sort of private, use oauthServer attribute to control this.
            v2RequestAuthUrl: {
                value: "https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=",
                validator: 'isString',
                getter: function (value) {
                    if (this.get("oauthServer")) {
                        return "https://" + this.get("oauthServer") + "/oauth/v2/request_auth?oauth_token=";
                    } else {
                        return value;
                    }
                }
            },

            // only headers are supported at the moment.
            oauthMode: {
                value: OAUTH_MODE_HEADER,
                validator: 'isString'
            },

            // open source version
            oauthVersion: {
                value: "1.0",
                validator: 'isString'
            },

            oauthProvider: {
                value: YAHOO,
                validator: 'isString'
            },

            appId: {
                value: "",
                validator: 'isString'
            }
        }
    });

    /**
     * The 'OAuthAutomator' class is attached to Y instance. 
     */
    Y.Arrow.OAuthAutomator = OAuthAutomator;

}, '0.0.2', {
    requires: ['base', 'io-base']
});
