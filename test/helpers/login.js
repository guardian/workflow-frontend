module.exports = function () {
    /*
     * Contains helpers for logging in to the right environment
     * etc.
     * TODO: Put the email and password somewhere more subtle
     */

    var environment = process.env.ENVIRONMENT || 'release';
    var email = "composer.test@guardian.co.uk";
    var password = "2&rDC*Ej";

    // Lookup environment to run against from the ENVIRONMENT variable
    var workflowUri = {
        dev:     'http://localhost:9081/admin',
        code:    'https://workflow.code.dev-gutools.co.uk',
        release: 'https://workflow.release.dev-gutools.co.uk'
    }[environment];

    /*
     * Contains helpers for logging in
     */
    var loginHelper = {
        /*
         * Enters the url details and logs in. If it does not
         * reach the expected environment then it will reject the initial
         * promise and throw an error. Thus all the tests will immediately
         * fail.
         */
        login: function () {
            browser.driver.get(workflowUri);
            browser.driver.findElement(by.id("Email")).sendKeys(email);
            browser.driver.findElement(by.id("Passwd")).sendKeys(password);
            browser.driver.findElement(by.id("signIn")).click();


            browser.driver.getCurrentUrl().then(function(currentUrl) {

                if (/accounts.google.com/.test(currentUrl)) {
                    // not logged in - so try again
                    loginHelper.login();
                } else if (currentUrl.substring(0, currentUrl.length - 1) !== workflowUri) {
                    // reject this promise as we failed to log in
                    reject("login-failed");
                }

                // else we continue - we are already logged in
                // and login was a sucess
            }.bind(this)).then(function() {
                return loginHelper.waitTitle('Workflow');
            }, function (err) {
                /* error handler for a failed login
                 * for now we just fail - but we might
                 * want to add retry logic in the future
                 */

                // quit the browser as it's mostly just annoying leaving it open
                browser.driver.quit().then(function () {
                    throw 'login-failed';
                });
            });




        },
        waitTitle: function (expectedTitle) {
            return browser.driver.wait(function() {
                return browser.driver.getTitle().then(function(actualTitle) {
                    return actualTitle === expectedTitle;
                });
            });
        },

        url: function () {
            return workflowUri;
        },
        email: email,
        password: password
    };

    return loginHelper;
}();
