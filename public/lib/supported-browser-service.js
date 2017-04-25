import angular from 'angular';
import UAParser from 'ua-parser-js';


angular.module('wfSupportedBrowserService', [])
    .factory('wfSupportedBrowserService', ['$rootScope', function($rootScope) {

        class SupportedBrowserService
        {
            checkSupportedBrowser() {
                var supportedBrowserCollection = [
                    {
                        browserName: 'Chrome',
                        browserVersion: 37
                    },
                    {
                        browserName: 'Firefox',
                        browserVersion: 31
                    },
                    {
                        browserName: 'Chromium',
                        browserVersion: 37
                    }
                ];

                // parse the user agent string to get browser name and version
                var ua = new UAParser(), 
                    browser = ua.getBrowser(),
                    userBrowserName = browser.name,
                    userBrowserVersion = browser.major;

                var supported = supportedBrowserCollection.some((b) => {
                    return (userBrowserName === b.browserName && userBrowserVersion >= b.browserVersion);
                });

                // if the browser is not supported, alert the user
                if (!supported) {
                    $rootScope.$broadcast('userMessage.show', {
                        name: "browserNotSupported",
                        dismissable: true,
                        messageType: 'notification'
                    });
                }
            }
        }

        return new SupportedBrowserService();
    }]);
