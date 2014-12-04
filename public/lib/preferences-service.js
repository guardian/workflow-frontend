import angular from 'angular';
import moment from 'moment';

angular.module('wfPreferencesService', [])
    .factory('wfPreferencesService', ['$rootScope', '$http', '$log',
        function($rootScope, $http, $log) {

            class PreferencesService {

                constructor() {
                    this.preferencesUrl = _wfConfig.preferencesUrl;
                    this.user = _wfConfig.user.email;
                    this.prefsPromise = this.retrievePrefrences().then(function success (data) {
                        console.log("RECIEVED");
                        self.preferences = data.data;
                        return self.preferences;
                    }, function error () {
                        $log.error("Could not fetch preferences", arguments);
                        return Promise.reject();
                    });
                }

                packageData(data) {
                    return {
                        data: {
                            value: JSON.stringify(data),
                            namespace: "workflow"
                        }
                    }
                }

                url(path) {
                    return this.preferencesUrl + path;
                }

                getPreference(name) {
                    var self = this;
                    if (this.preferences) {
                        return Promise.resolve(this.preferences[name]);
                    } else {
                        console.log("taking prefs branch here");
                        return this.prefsPromise.then(function resolve (data) {
                            console.log("GET RESOLVE", name, data);
                            return data[name];
                        }, function reject () {
                            console.log("GET REJECT");
                            return Promise.reject();
                        });
                    }
                }

                setPreference(name, data) {
                    return $http.post(
                        this.url("/preference/" + name),
                        this.packageData(data),
                        {
                            withCredentials: true
                        }
                    );
                }

                retrievePrefrences() {
                    return $http.get(this.url("/preferences/" + this.user), {
                        withCredentials: true,
                        transformResponse: this.transformResponse
                    });
                }

                transformResponse(data, headersGetter) {
                    data = JSON.parse(data).data;
                    var wfPrefs = data.preferences.workflow;
                    for (var key in wfPrefs) {
                        wfPrefs[key] = JSON.parse(wfPrefs[key]);
                    }
                    return wfPrefs;
                }
            }

            return new PreferencesService();

        }
    ]);
