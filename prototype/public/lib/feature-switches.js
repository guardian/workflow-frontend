define([], function () {

    var module = angular.module('wfFeatureSwitches', []);

    module.factory('wfFeatureSwitches', ['config', '$http', '$q', function(config, $http, $q) {
        var self = {}

        // dummy switches - eventually this will come from the server
        // via an API call

        var staticSwitchData = { "presence-indicator": document.cookie.search("presence-indicator=1(;|$)") != -1 }
        var switches = new Promise(function(resolve, reject) {
            resolve(staticSwitchData);
        });

        self.getSwitch = function(sw) {
            return switches.then(function(switches) { return switches[sw]; })
        }

        return self;

    }]);
})
