import _ from "underscore"
import { wfPresenceIndicatorsDirective } from 'components/presence-indicator/presence-indicators';
import { wfPresenceCurrentState } from 'components/presence-indicator/presence-status';

var module = angular.module('wfPresenceService', []);

module.factory('wfPresenceService', ['$rootScope', '$log', 'config', 'wfFeatureSwitches', 'wfUser', function($rootScope, $log, config, wfFeatureSwitches, wfUser) {

    function presenceError(msg) {
        var err = new Error(msg);
        err.name = "PresenceError";
         $log.warn(["Presence max-retries, error:", new Date()].join(' '));
        $log.error("Presence error: " + msg);
        $rootScope.$apply(function () { throw err });
        broadcast("presence.connection.error", msg);
    }

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

        // call normal error procedure for presence, and then
        // additionally reject this promise
        function promisePresenceError(msg) {
            presenceError(msg);
            presenceReject(msg);
        }

        self.whenEnabled.then(
            // 1. Is presence enabled?
            ()=>System.import('presence-client'),
            ()=>promisePresenceError("presence is disabled")
        ).then(
            // 2. Have we loaded the client library?
            (presenceClient) => {
                var p = presenceClient(self.endpoint, person);
                // for all successful connections, trigger a subscribe
                // (this will happen on initial connection, but also if we
                // lose connection and then it is restored)
                p.on('connection.open', () => {
                    broadcast("presence.connection.open");
                    p.subscribe(currentArticleIds).catch((err) => $log.error('error subscribing ', err));
                });
                // the 'error' event gets triggered for each of the
                // three retries, but 'connection.error' will only get
                // triggered if we finally give up.
                p.on('connection.error', msg => {
                    presenceError(msg);
                });
                addHandlers(p, messageHandlers);
                // startConnection() will return a promise that will be
                // resolved once the conection has been successfully
                // established. So we return a chained promise that
                // replaces the return value with our presenceClient object
                return p.startConnection().then(() => presenceResolve(p), () => promisePresenceError("unable to establish connection to presence"));
            },
            (err) => {
                promisePresenceError("Could not get access to the client library: " + err);
            }).catch((err)=>{
                promisePresenceError("error starting presence" + err);
            });
    });

    self.subscribe = function (articleIds) {
        currentArticleIds = articleIds;
        presence.then((p) => p.subscribe(articleIds), (msg) => {
            $log.error("could not subscribe to presence [" + msg + "]");
        });
    };

    return self;

}]);

module.factory('wfPresenceCurrentState', ['$rootScope', wfPresenceCurrentState]);

module.directive('wfPresenceIndicators', ['$rootScope', 'wfPresenceService',
                                          'wfPresenceCurrentState','$log',
                                          wfPresenceIndicatorsDirective]);
