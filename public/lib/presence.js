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

    var currentArticleIds = [];

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
    var presence = new Promise(function(presenceResolve, presenceReject) {

        function error(msg) {
            $log.error("Presence error: " + msg);
            presenceReject(msg);
        }

        self.whenEnabled.then(
            // 1. Is presence enabled?
            ()=>System.import('presence-client'),
            ()=>error("presence is disabled")
        ).then(
            // 2. Have we loaded the client library?
            (presenceClient) => {
                var p = presenceClient(self.endpoint, person);
                // for all successful connections, trigger a subscribe
                // (this will happen on initial connection, but also if we
                // lose connection and then it is restored)
                p.on('connection.open', () => {
                    p.subscribe(currentArticleIds).catch((err) => $log.error('error subscribing ', err));
                });
                p.on('error', msg => {
                    $log.error('presence error ', msg);
                });
                addHandlers(p, messageHandlers);
                // startConnection() will return a promise that will be
                // resolved once the conection has been successfully
                // established. So we return a chained promise that
                // replaces the return value with our presenceClient object
                return p.startConnection().then(() => presenceResolve(p), () => error("unable to establish connection to presence"));
            },
            () => {
                broadcast("presence.connection.error", "Could not get access to the library");
                error("Could not get access to the client library");
            });
        // .catch((err)=>{
        //     $log.error("error starting presence", err);
        // });
    });

    self.articleSubscribe = function (articleIds) {
        currentArticleIds = articleIds;
        var p = presence
            .then((p) => p.subscribe(articleIds))
        
        p.catch( function(msg){
            $log.error("could not subscribe to presence [" + msg + "]", p.url, arguments);
            broadcast("presence.connection.error");
        });
        return p
    };

    // Subscribe var/function moved from wfPresenceSubscription controller
    var deRegisterPreviousSubscribe = angular.noop;

    self.subscribe = function(composerIds) {
        return presence.then(function() {
            return self.articleSubscribe(composerIds);
        });

    };

    return self;

}]);

module.factory('wfPresenceCurrentState', ['$rootScope', wfPresenceCurrentState]);

module.directive('wfPresenceIndicators', ['$rootScope', 'wfPresenceService',
                                          'wfPresenceCurrentState','$log',
                                          wfPresenceIndicatorsDirective]);
