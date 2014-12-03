var loginHelper = require('./helpers/login');
var extend = require('extend');
var tunnelId = require('./unique-id');
var fs = require('fs');

/* a require helper to avoid nested ../../../ hell */
global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
};

/*
 * Crude way of silencing console logs
 * Yes it defaults to on for now
 */
if (process.env.CT_DEBUG) {
    console.log = function () {
        return;
    };
}

var sauceCredentials = {
    username:  process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY
};


// TODO: make it more configurable
var browserEnv = {
    // Ideally would run on OS X to simulate editorial machines, but
    // the OS X vms seem a lot less reliable, so falling back to
    // Windows for the moment.
    // platform: 'OS X 10.6',
    platform: 'Windows 8',
    browserName: 'chrome',
    version: '32'
};

// Set which browser to run in when running locally
var localEnv = {
    browserName: 'chrome'
};


var seleniumAddress;
var capabilities = {
    'tunnel-identifier': tunnelId,
    shardTestFiles: true,
    maxInstances: 10
};
var extraConfig = {};
var extraJasmineOpts = {
    isVerbose: true
};

var useSauceLabs = !! process.env.RUN_IN_SAUCE_LABS;
if (useSauceLabs) {
    // SauceConnect port (it must be running!)
    seleniumAddress = 'http://localhost:4445/wd/hub';
    capabilities = extend({}, capabilities, sauceCredentials, browserEnv);
} else {
    // Default Selenium WebDriver port
    seleniumAddress = 'http://localhost:4444/wd/hub';
    capabilities = extend({}, capabilities, localEnv);
}



var onTeamCity = !! process.env.RUN_IN_TEAMCITY;

function onPrepare() {

    /* special handling for team city */
    if (onTeamCity) {
        require('jasmine-reporters');
        jasmine.getEnv().addReporter(new jasmine.TeamcityReporter());
    }

    jasmine.getEnv().addReporter(new ScreenShotReporter({
        baseDirectory: '../../../fail-screenshots'
    }));

    loginHelper.login();

    browser.driver.manage().window().setSize(1200, 900);

}

exports.config = {
    onPrepare: onPrepare,
    seleniumAddress: seleniumAddress,
    capabilities: capabilities,
    specs: ['specs/*test.js'],
    allScriptsTimeout: 40000000,
    getPageTimeout: 40000,
    jasmineNodeOpts: extend({
        defaultTimeoutInterval: 4000000
    }, extraJasmineOpts)
};