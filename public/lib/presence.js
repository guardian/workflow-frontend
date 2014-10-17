define(["node-uuid", "underscore"], function (uuid, _) {

    var module = angular.module('wfPresenceService', []);

    module.factory('wfPresenceService', ['$rootScope', '$log',  'config', 'wfFeatureSwitches', 'wfUser', function($rootScope, $log, config, wfFeatureSwitches, wfUser) {

        var self = {};

        self.whenEnabled = wfFeatureSwitches.getSwitch("presence-indicator").then(function (value) {
          if(value) return true;
          else reject("presence disabled");
        }, function(err) {
          $log.error("error: " + err);
        });

        self.connId = uuid();

        self.endpoint = config.presenceUrl + "/" + self.connId;

        function broadcast(name, data) {
            /* use apply to make it take effect straight away */
            $rootScope.$apply(function () {
                $rootScope.$broadcast(name, data);
            });
        }

        var messageHandlers = {
            "connectionTest": function() {
                /* XXX TODO : how should I reply to this connectionTest request? */
            },
            "subscribed": function(data) {
                self.clientId = data.clientId;
                broadcast("presence.subscribed", data);
            },
            "updated": function(data) {
                broadcast("presence.status", data);
            }
        };

        function messageHandler(msgJson) {
            var msg = JSON.parse(msgJson);

            if(typeof messageHandlers[msg.action] !== "function") {

                $log.error("received unknown message action: " + msg.action);

                broadcast("presence.error.unknownAction", msg);
                return;
            }

            messageHandlers[msg.action](msg.data);
        }

        var _socket = Promise.reject("not yet connected");

        function doConnection() {
            _socket = new Promise( function(resolve, reject) {
                var s = new WebSocket(self.endpoint);
                s.onerror   = function () {
                    reject();
                    broadcast("presence.connection.error");
                };
                s.onopen    = function () {
                    resolve(s);
                    broadcast("presence.connection.success");
                };
                s.onclose   = function () {
                    broadcast("presence.connection.closed");
                };
                s.onmessage = function(ev) {
                    $log.debug("Presence message: ", ev.data);
                    messageHandler(ev.data);
                };
            });
            return _socket;
        }

        self.person = {
            firstName : wfUser.firstName,
            lastName  : wfUser.lastName,
            email     : wfUser.email,
            browserId : navigator.userAgent,
            googleId  : "00000" // required but not used
        };

        function makeRequest(action, data) {
            return { action: action, data: data };
        }

        function makeSubscriptionRequest(articleIds) {
            return makeRequest("subscribe", {
                "person": self.person,
                "subscriptionIds": articleIds
            });
        }

        /* returns a promise */
        function sendJson(data) {
            return _socket.then(function(socket) {
                socket.send(JSON.stringify(data));
            });
        }

        self.articleSubscribe = function (articleIds) {
            var ids = (Array.isArray(articleIds)) ? articleIds : Array(articleIds);
            var p = sendJson(makeSubscriptionRequest(ids));
            return p;
        };

        self.whenEnabled.then(function() {
            $log.info("presence is enabled... attempting connection");
            doConnection();

            $rootScope.$on("presence.connection.closed", doConnection);
            $rootScope.$on("presence.connection.error",  doConnection);

        }, function() {
            $log.info("presence is disabled");
        });


        // Initial data var/function moved from wfPresenceSubscription controller
        // FIXME should this be onConnection?
        var initialData = new Promise(function(resolve, reject) {
            reject("no subscription request made");
        });

        self.initialData = function(id) {
            return self.whenEnabled.then(initialData).then(function (data) {
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
                    var removeListener = $scope.$on("presence.subscribed", function (ev, data) {
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

                        $scope.$on("presence.connection.success", function () {
                            $scope.connectionStatus = "ok";
                        });
                        $scope.$on("presence.connection.error", function () {
                            $scope.connectionStatus = "error";
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
});
