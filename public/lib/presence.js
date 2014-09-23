define([], function () {

    var module = angular.module('wfPresenceService', []);

    module.factory('wfPresenceService', ['$rootScope', 'config', function($rootScope, config) {

        var self = {};

        self.endpoint = config.presenceUrl;

        var messageHandlers = {
            "connectionTest": function() {
                /* XXX TODO : how should I reply to this connectionTest request? */
                // console.log("recieved connection test request from server")
            },
            "subscribed": function(data) {
                self.clientId = data.clientId;
                $rootScope.$broadcast("presence.subscribed", data);
            },
            "updated": function(data) {
                console.log("XXX PMR receiving updated message");
                $rootScope.$broadcast("presence.status", data);
            }
        }

        function messageHandler(msgJson) {
            var msg = JSON.parse(msgJson);
            console.log("PMR: messageHandler", msgJson);
            if(typeof messageHandlers[msg.action] === "function") {
                messageHandlers[msg.action](msg.data);
            } else {
                console.log("receive unknown message action: " + msg.action);
                $rootScope.$broadcast("presence.error.unknownAction", msg);
            }
        }

        var _socket = Promise.reject("not yet connected");

        function doConnection() {
            _socket = new Promise( function(resolve, reject) {
                var s = new WebSocket(self.endpoint);
                s.onerror   = function () {
                    reject();
                    $rootScope.$broadcast("presence.connection.error");
                };
                s.onopen    = function () {
                    resolve(s);
                    $rootScope.$broadcast("presence.connection.success");
                };
                s.onclose   = function () { $rootScope.$broadcast("presence.connection.closed"); };
                s.onmessage = function(ev) { messageHandler(ev.data); };
            });
            return _socket;
        }

        self.person = {
            firstName : "Paul",
            lastName  : "Roberts",
            email     : "paul.roberts@guardian.co.uk",
            browserId : "12345",
            googleId  : "123456"
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
                console.log("sending: " + JSON.stringify(data));
            });
        }

        self.articleSubscribe = function(articleIds) {
            var ids = (Array.isArray(articleIds)) ? articleIds : Array(articleIds);
            var p = sendJson(makeSubscriptionRequest(ids));
            p.then(function () { console.log("sent request: ", makeSubscriptionRequest(ids)) });
            return p;
        }

        doConnection();

        $rootScope.$on("presence.connection.closed", doConnection);
        $rootScope.$on("presence.connection.error",  doConnection);

        return self;

    }]);

    module.controller(
        'wfPresenceConnectionStatus',
        [ "$scope", "wfPresenceService", function($scope, wfPresenceService) {
            $scope.connectionStatus = "PRE";

            $scope.$on("presence.connection.success", function () {
                $scope.connectionStatus = "OK";
            });
            $scope.$on("presence.connection.error", function () {
                $scope.connectionStatus = "ERROR";
            });

            $scope.$on("presence.connection.closed", function () {
                $scope.connectionStatus = "CLOSED";
            });
        }]);

    module.controller(
        'wfPresenceSubscription',
        [ "$scope", "$q", "wfPresenceService", function($scope, $q, wfPresenceService) {

            var initialData = null;

            $scope.initialData = function(id) {
                if(initialData == null) return $q.reject("no subscription has been made yet");
                else return initialData.promise.then(function (data) {
                    return _.find(data, function(d) {
                        return d.subscriptionId == id;
                    }).currentState;
                });
            }

            $scope.$on("presence.subscribed", function (ev, data) {
                initialData && initialData.resolve(data.subscribedTo);
            });

            function getIds(content) {
                return _.pluck(_.flatten(_.values(content)), "composerId")
            }

            function doSubscription(ids) {
                initialData = $q.defer();
                initialData.promise.then(function (data) {
                    console.log("pmrLog-1 initialData has arrived", data);
                });

                wfPresenceService.articleSubscribe(ids);
            }

            $scope.$watch(function($scope) {
                var content = $scope["contentByStatus"];
                return (content && getIds(content)) || [];
            }, function (newVal, oldVal) {
                if(newVal !== oldVal) {
                    doSubscription(newVal);
                }
                console.log("pmrLog-1 -> changed", newVal, oldVal);
            }, true);

        }]);

    module.controller('wfPresenceIndicatorController', [ "$scope", function($scope) {

        var id = $scope.content.composerId;
        console.log("wfPresenceIndicatorController: content: ", id);

        $scope.indicatorText = "";
        $scope.status = "unknown";

        function applyCurrentState(currentState) {
            if(currentState.length == 0) {
                $scope.presence = [{ status: "free", indicatorText: ""}]
            } else {

                $scope.presence = _.map(
                    _.uniq(currentState, false, function(s) { return s.clientId.person.email }),
                    function (pr) {
                        var person = pr.clientId.person;
                        return { indicatorText:
                                 (person.firstName.charAt(0) + person.lastName.charAt(0)).toUpperCase(),
                                 status: pr.clientId.status };
                    });
            }
        }

        $scope.initialData(id).then(function (currentState) {
            console.log("about to apply initial data:", currentState);
            applyCurrentState(currentState);
        });

        $scope.$on("presence.status", function(ev, data) {
            if(id === data.subscriptionId) {
                applyCurrentState(data.currentState);
            }
            console.log("wfPresenceIndicatorController event handler", data);
        });


    }]);


});
