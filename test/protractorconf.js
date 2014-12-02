var loginHelper = require('./helpers/login');

exports.config = {
    // The Address to find selenium when the selenium server is running
    seleniumAddress: 'http://localhost:4444/wd/hub',
    // Run all specs
    specs: ['specs/*']
}

    // Before all of the tests, login
function onPrepare() {
    loginHelper.login();
}
