define([
'angular',
'moment'],
function(angular, moment) {

    /*
     * This decorator provides a simple wrapper around logging to make it easier
     * to get information from the client.
     */
    var LOG_URL = "/support/logger";

    var logger = angular.module('logger', []);

    logger.factory('logger', ['$injector', function($injector) {

        function send(message, level, fields) {
            var $http = $injector.get('$http');

            var data = {
                timestamp: moment().format("YYYY-MM-DDTHH:mm:ss.SSSZZ"),
                message: message,
                level: level || "INFO",
                fields: fields
            };

            return $http({method: 'POST',
                   url: LOG_URL,
                   data: data
                  });
        }

        return {
            log: send
        };
    }]);
});
