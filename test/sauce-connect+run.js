var sauceConnectLauncherFn = require('sauce-connect-launcher');
var tunnelId = require('./unique-id');

var sauceConnectOptions = {
    username:  process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    tunnelIdentifier: tunnelId,
    verbose:   true,
    logStats: '1', // log net stats every second
    logfile:  'saucelabs-debug.log'
};


var Q = require('q');
var extend = require('extend');

var sauceConnectLauncher = Q.denodeify(sauceConnectLauncherFn);


var spawn = require('child_process').spawn;

function runProtractor(config) {
    return Q.Promise(function(resolve, reject) {
        var ptor = spawn('node_modules/.bin/protractor', [config], {
            env: extend(process.env, {RUN_IN_SAUCE_LABS: '1'})
        });
        ptor.stdout.on('data', function(data) {
            console.log('[protractor] ' + data.toString().trim());
        });
        ptor.stderr.on('data', function(data) {
            console.error('[protractor] [ERROR] ' + data.toString().trim());
        });
        ptor.on('close', function(code) {
            console.log('protractor exited with code ' + code);
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('protractor exited with code ' + code));
            }
        });
    });
}


var sauceConnectProcess;
console.log("Starting Sauce Connect...");

sauceConnectLauncher(sauceConnectOptions).then(function(scProcess) {
    console.log("Sauce Connect ready");

    // Eww, side-effects...
    sauceConnectProcess = scProcess;

    console.log("Start protractor...");
    return runProtractor('protractorconf.js');
}).then(function() {
    console.log("Shutdown Sauce Connect...");
// TODO: as promise?
    sauceConnectProcess.close(function () {
    });
}).then(function() {
    console.log("Closed Sauce Connect process");

    // We're done!
}).catch(function(err) {
    console.log("Caught error", err);
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});
