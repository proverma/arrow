describe('#login', function () {
    describe('#get page title', function () {
        it('should get a correct title', function () {
            var title = "Yahoo! Search - Web Search";
            assert(title == document.title);
        }),
            it('should be able to use yui instance and share lib', function (done) {
                console.log(YUI.version);
                YUI().use('test', function (Y) {
                    this.data = {
                        name: "test",
                        year: 2007,
                        beta: true
                    };
                    var Assert = Y.Assert;
                    Assert.isObject(this.data);
                    Assert.isString(this.data.name);
                    Assert.areEqual("test", this.data.name);
                    done();
                });

                YUI().use('cookieUtil', function (Y) {
                    var cookieUtil = new Y.Arrow.CookieUtil({});
                    cookieUtil.getCookiesFromHeader(null, function (err, cookies) {
                        assert("illegal response" == err.message);
                        done();
                    });
                });

            })
    })
})