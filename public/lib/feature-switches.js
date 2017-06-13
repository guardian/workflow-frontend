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

        self.getCookie = function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for(let i=0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        };

        return self;

    }]);
});
