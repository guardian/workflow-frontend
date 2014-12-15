import _ from "underscore"
import { wfPresenceIndicatorsDirective } from 'components/presence-indicator/presence-indicators';
import { wfPresenceCurrentState } from 'components/presence-indicator/presence-status';

var module = angular.module('wfPresenceService', []);

module.factory('wfPresenceService', ['$rootScope', '$log', 'config', 'wfFeatureSwitches', 'wfUser', function($rootScope, $log, config, wfFeatureSwitches, wfUser) {

    var self = {};

//    Save this code for when feature switched are implemented.
//    self.whenEnabled = wfFeatureSwitches.getSwitch("presence-indicator").then(function (value) {
//        if(value) return true;
//        else reject("presence disabled");
//    }, function(err) {
//        $log.error("error: " + err);
//    });

    self.whenEnabled = Promise.resolve(true);

    self.endpoint = config.presenceUrl;

    function broadcast(name, data) {
        /* use apply to make it take effect straight away */
        $rootScope.$apply(function () {
            $rootScope.$broadcast(name, data);
        });
    }

    var messageHandlers = {
        "visitor-list-subscribe": function(msg) {
            broadcast("presence.subscribed", msg.data);
        },
        "visitor-list-updated": function(msg) {
            broadcast("presence.status", msg);
        }
    };

    function addHandlers(presence, handlers) {
        _.forEach(_.keys(handlers), (eventName) => {
            presence.register(eventName, handlers[eventName]);
        });
    }

    // this is required, and passed to the presence client
    // library, and should return a promise which points to the
    // current user
    var person = {
        firstName : wfUser.firstName,
        lastName  : wfUser.lastName,
        email     : wfUser.email
    };
    // INITIATE the connection if presence is enabled
    var presence = self.whenEnabled.then(
        // 1. Is presence enabled?
        ()=>System.import('presence-client'),
        ()=>$log.info("presence is disabled")
    ).then(
        // 2. Have we loaded the client library?
        (presenceClient) => {
            var clientPromise =
                new Promise((resolve, reject) => {
                    var client = presenceClient(self.endpoint, person);
                    client.on('connection.open', ()=>resolve(client));
                    client.on('connection.error', reject);
                    client.startConnection();
                });
            clientPromise.then(
                // 3. have successfully connected?
                (client) => {
                    $log.info("presence connection open");
                    broadcast("presence.connection.success", client.url);
                    addHandlers(client, messageHandlers);
                    return client;
                },
                () => $log.error("could not open presence connection")
            );
            return clientPromise;
        },
        () => {
            broadcast("presence.connection.error", "Could not get access to the library ");
        }).catch((err)=>{
            $log.error("error starting presence", err);
        });

    self.articleSubscribe = function (articleIds) {
        var p = presence.then((p) => p.subscribe(articleIds).catch(
            function(){
                $log.error("could not subscribe to presence", p.url, arguments);
                broadcast("presence.connection.error");
        }));
        return p
    };

    // Subscribe var/function moved from wfPresenceSubscription controller
    var deRegisterPreviousSubscribe = angular.noop;

    self.subscribe = function(composerIds) {
        return self.whenEnabled.then(function() {
            return self.articleSubscribe(composerIds);
        });

    };

    return self;

}]);

module.factory('wfPresenceCurrentState', ['$rootScope', wfPresenceCurrentState]);

module.directive('wfPresenceIndicators', ['$rootScope', 'wfPresenceService',
                                          'wfPresenceCurrentState','$log',
                                          wfPresenceIndicatorsDirective]);
