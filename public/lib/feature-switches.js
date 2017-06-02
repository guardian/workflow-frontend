define([], function () {

    const module = angular.module('wfFeatureSwitches', []);

    module.factory('wfFeatureSwitches', ['config', '$http', function(config, $http) {
        const self = {};

        // dummy switches - eventually this will come from the server
        // via an API call

        function simpleCookie(cookieName) {
            return document.cookie.search(cookieName + "=1(;|$)") != -1;
        }

        const staticSwitchData = {
            "presence-indicator": simpleCookie("presence-indicator"),
            "incopy-export": simpleCookie("incopy-export"),
            "support-atoms": simpleCookie("support-atoms")
        };

        const switches = new Promise(function (resolve, reject) {
            resolve(staticSwitchData);
        });

        self.getSwitch = function(sw) {
            return switches.then(function(switches) { return switches[sw]; })
        };

        self.withSwitch = function(sw, f) {
            self.getSwitch(sw).then(f);
        };

        return self;

    }]);
});
