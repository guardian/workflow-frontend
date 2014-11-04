import _ from "underscore"
var module = angular.module('wfPresenceService', []);

module.factory('wfPresenceService', ['$rootScope', '$log', 'config', 'wfFeatureSwitches', 'wfUser', function($rootScope, $log, config, wfFeatureSwitches, wfUser) {

    var self = {};

    self.whenEnabled = wfFeatureSwitches.getSwitch("presence-indicator").then(function (value) {
        if(value) return true;
        else reject("presence disabled");
    }, function(err) {
        $log.error("error: " + err);
    });

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
    }
    // INITIATE the connection if presence is enabled
    var presence = self.whenEnabled.then(()=>System.import('presence-client')).then(
                    (presenceClient) => {
                        var client = presenceClient(self.endpoint, person);
                            client.on('open', () => broadcast("presence.connection.open"));
                            client.startConnection()
                                .then((p) => {
                                    addHandlers(p, messageHandlers);
                                    p.onConnectionError(function () {
                                        broadcast("presence.connection.error", "Lost connection to " + p.url);
                                    });
                                    broadcast("presence.connection.success", p.url);
                                })
                            return client;
                    },
                    () => {
                        $log.info("presence is disabled");
                        broadcast("presence.connection.error", "Could not get access to the library ");
                    }).catch((err)=>{
                        $log.error(err);
                    });

    self.articleSubscribe = function (articleIds) {
        var p = presence.then((p) => p.subscribe(articleIds).catch(
            function(){
                $log.error("could not subscribe to presence ", p.url);
                broadcast("presence.connection.error");
        }));
        return p
    };

    // Initial data var/function moved from wfPresenceSubscription controller
    // FIXME should this be onConnection?
    var initialData = new Promise(function(resolve, reject) {
        reject("no subscription request made");
    });

    self.initialData = function(id) {
        return initialData.then(function (data) {
            return new Promise(function(resolve, reject) {
                var found = _.find(data, function(d) {
                    return d.subscriptionId === id;
                });
                if(!found) {
                    reject("unknown ID: [" + id + "]");
                } else {
                    resolve(found.currentState);
                }
            });
        });
    };


    // Subscribe var/function moved from wfPresenceSubscription controller
    var deRegisterPreviousSubscribe = angular.noop;

    self.subscribe = function(composerIds) {
        return self.whenEnabled.then(function() {

            deRegisterPreviousSubscribe();

            // set up a promise that will wait for the event to be
            // transmitted from the wfPresenceService and return
            // the results.
            initialData = new Promise(function(resolve, reject) {
                // $on will return a function that can be used
                // later to deregister the listener
                var removeListener = $rootScope.$on("presence.subscribed", function (ev, data) {
                    resolve(data.subscribedTo);
                });
                deRegisterPreviousSubscribe = function() {
                    // first tell anyone waiting on this listener
                    // that it was cancelled.
                    reject("replace with new subscribe request");
                    // then call the deRegister function that $on
                    // gave us.
                    removeListener();
                };
            });

            self.articleSubscribe(composerIds);

        });

    };

    return self;

}]);

module.directive(
    'wfPresenceConnectionStatus', ['wfPresenceService',
    function (wfPresenceService) {
        return {
            link: function($scope, element) {

                $scope.presenceEnabled = false;
                $scope.connectionStatus = "disabled";

                wfPresenceService.whenEnabled.then(function () {
                    $scope.presenceEnabled = true;
                    $scope.connectionStatus = "connecting";

                    $scope.$on("presence.connection.success", function (ev, data) {
                        $scope.connectionStatus = "ok";
                        $scope.connectionMessage = "Connected to: " + data;
                    });
                    $scope.$on("presence.connection.error", function (err) {
                        $scope.connectionStatus = "error";
                        $scope.connectionMessage = err;
                    });

                    $scope.$on("presence.connection.closed", function () {
                        $scope.connectionStatus = "closed";
                    });
                });
            }
        };
    }]);


module.directive('wfPresenceIndicators', ['$rootScope', 'wfPresenceService', function($rootScope, wfPresenceService) {

    return {
        restrict: 'E',
        templateUrl: "/assets/components/presence-indicator/presence-indicators.html",
        scope: {
            id: "=presenceId"
        },
        link: function($scope) {

            function applyCurrentState(currentState) {
                if(currentState.length === 0) {
                    $scope.presences = [{ status: "free", indicatorText: ""}];
                } else {
                    $scope.presences = _.map(
                        _.uniq(currentState, false, function(s) { return s.clientId.person.email; }),
                        function (pr) {
                            var person = pr.clientId.person;
                            return { indicatorText:
                                     (person.firstName.charAt(0) + person.lastName.charAt(0)).toUpperCase(),
                                     longText: [person.firstName, person.lastName].join(" "),
                                     email: person.email,
                                     status: "present" };
                        });
                }
            }

            if ($scope.id) {
                wfPresenceService.initialData($scope.id).then(function (currentState) {
                    applyCurrentState(currentState);
                }, function (err) {
                    $log.error("Error getting initial data:", err);
                });

                $scope.$on("presence.status", function(ev, data) {
                    if($scope.id === data.subscriptionId) {
                        applyCurrentState(data.currentState);
                    }
                });
            }
        }
    };
}]);
