import angular from 'angular';
import UAParser from 'ua-parser/ua-parser.min';
import 'components/user-message/user-message';


angular.module('wfSupportedBrowserService', ['wfUserMessage'])
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

                var ua = new UAParser(), // parse the user agent
                    browser = ua.getBrowser(),
                    userBrowserName = browser.name,
                    userBrowserVersion = browser.major;

                var supported = supportedBrowserCollection.some(function(b) {
                    return (userBrowserName === b.browserName && userBrowserVersion >= b.browserVersion);
                });

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