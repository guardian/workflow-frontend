import angular from 'angular';

angular
    .module('wfPollingService', [])
    .factory('wfPollingService', ['$http', '$timeout', '$rootScope', function ($http, $timeout, $rootScope) {
        var POLLING_DELAY = 5000;

        class PollingService {
            constructor(service, paramsProvider) {
                this._service        = service;
                this._paramsProvider = paramsProvider;

                this.init();
            }

            init() {
                // event provided by visibility service
                $rootScope.$on('visibility.changed', (function (event, data) {
                    if (data.visibility) {
                        this.startPolling();
                    } else {
                        this.stopPolling();
                    }
                }).bind(this));
            }

            onPoll(callback) {
                this._callback = callback;
            }

            onError(callback) {
                this._errorCallback = callback;
            }

            startPolling() {
                return this.refresh();
            }

            stopPolling() {
                if (this._timer) {
                    $timeout.cancel(this._timer);
                    this._timer = false;
                }
            }

            refresh() {
                this.stopPolling();

                return this._service.get(this._paramsProvider())
                    .then(this._callback)
                    .then( () => {
                        this._timer = $timeout(this.refresh.bind(this), POLLING_DELAY);
                    })
                    .catch((err) => {
                        if (this._errorCallback) {
                            this._errorCallback(err);
                        }
                    });
            }
        }

        return PollingService;
    }]);
