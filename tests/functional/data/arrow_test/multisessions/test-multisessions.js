/*
 * Like other tests, this is a YUI test module
 *
 */
YUI.add("test-webdriver-tests", function (Y) {

    var suite = new Y.Test.Suite("Title test of the webdriver");
    suite.add(new Y.Test.Case({

        "test title": function() {
            var self = this;
            // if you are not using the default selenium host, you would need to pass seleniumHost url to WebDriverManager constructor
            //var webdriver_manager = new Y.Arrow.WebDriverManager(seleniumHost);
            var webdriver_manager = new Y.Arrow.WebDriverManager();

            var webdriver1 = webdriver_manager.createWebDriver({browserName: "chrome"});
            var webdriver2 = webdriver_manager.createWebDriver({browserName: "firefox"});

            webdriver1.get('http://www.google.com');
            webdriver1.findElement(webdriver1.By.name('q')).sendKeys('webdriver dsafsafasfsdafsa');
            webdriver1.findElement(webdriver1.By.name('btnK')).click();

            webdriver1.getTitle().then(function(title) {
                self.resume(function () {
                    Y.Assert.areEqual(title, "Google");
                    webdriver2.get('http://www.facebook.com');
                    webdriver2.getTitle().then(function(title) {
                        self.resume(function () {
                            Y.Assert.areEqual(title, "Welcome to Facebook - Log In, Sign Up or Learn More");
                            webdriver2.quit();
                            webdriver1.quit();
                        });
                    });
                    self.wait(12000);
                });
            });
            self.wait(12000);

            self.wait(function () {}, 8000);
        }
    }));

    //Never "run" the tests, simply add them to the suite. Arrow takes care of running them
    Y.Test.Runner.add(suite);
}, "0.1", {requires:["test", "arrow"]});

