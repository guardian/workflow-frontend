import angular from 'angular';

export const EVENT_PREFERENCE_CHANGED = 'wfPreferencesService.preferenceChanged';

angular.module('wfPreferencesService', [])
    .factory('wfPreferencesService', ['$rootScope', '$http', '$log', '$window',
        function($rootScope, $http, $log, $window) {

            var TIMEOUT = 5000;

            class PreferencesService {

                /**
                 * Constructor for prefs service. Set users email locally and kick off retrieval of users prefs
                 * from prefs app
                 */
                constructor() {

                    var self = this;

                    this.user = _wfConfig.user.email;

                    this.prefsPromise = this.retrievePrefrences().then(function success (data) {
                        self.preferences = data.data;
                        return self.preferences;
                    }, function error () {
                        $log.error('Could not fetch preferences', arguments);
                        return Promise.reject();
                    });

                    // Debugging tool for prefs
                    $window.workflowPrefsDebug = this.debug.bind(this);
                }

                /**
                 * Return a request url using the app config
                 * @param user
                 * @param prefKey
                 * @returns {string}
                 */
                url(user, prefKey) {
                    return _wfConfig.preferencesUrl + '/' + user + '/workflow' + (prefKey ? '/' + prefKey : '');
                }

                /**
                 * Return a promise of an http request to the preferences application for the users entire preference object
                 * @returns {HttpPromise}
                 */
                retrievePrefrences() {
                    return $http.get(this.url(this.user), {
                        timeout: TIMEOUT,
                        withCredentials: true,
                        transformResponse: this.transformResponse // custom transform on data
                    });
                }

                /**
                 * Perform a cutsom parse on returned preference data as we only care about the users prefs for workflow
                 * and want the data pre-parsed in to js objects ready for use
                 * @param data
                 * @param headersGetter
                 * @returns {Object} Parsed preference data narrowed to workflow prefs only
                 */
                transformResponse(data, headersGetter) {
                    if (data) {
                        var wfPrefs = JSON.parse(data).data;

                        for (var key in wfPrefs) {
                            if (wfPrefs.hasOwnProperty(key)) {
                                wfPrefs[key] = JSON.parse(wfPrefs[key]); // Parse all values to js objects as prefs returns a string here
                            }
                        }
                        return wfPrefs;
                    } else {
                        return null;
                    }
                }

                /**
                 * Helper method to package data in format expected by preferences app
                 * @param data
                 * @returns {{data: {value: *, namespace: string}}}
                 */
                packageData(data) {
                    return {
                        data: {
                            value: JSON.stringify(data)
                        }
                    }
                }

                /**
                 * Set a preference against the preferences app, return a promise for the request
                 * @param name
                 * @param data
                 * @returns {HttpPromise}
                 */
                setPreference(name, data) {
                    return $http.put(
                        this.url(this.user, name),
                        this.packageData(data),
                        {
                            withCredentials: true
                        }
                    ).then(() => {
                      $rootScope.$broadcast(EVENT_PREFERENCE_CHANGED, {
                        name, data
                      });
                    })
                }

                /**
                 * Get a preference. If preferences have already been set resolve a promise with the preference
                 * requested, else return the promise of the request to the preferences app that will resolve
                 * with the correct preference
                 * @param name
                 * @returns {Promise}
                 */
                getPreference(name) {
                    var self = this;
                    if (this.preferences) {
                        if (this.preferences[name] !== undefined) {
                            return Promise.resolve(this.preferences[name]);
                        } else {
                            $log.info('No preference set for: ' + name);
                            return Promise.reject();
                        }
                    } else {
                        return this.prefsPromise.then(function resolve (data) {
                            if (typeof data[name] !== "undefined") {
                                return data[name];
                            } else {
                                $log.info('No preference set for: ' + name);
                                return Promise.reject();
                            }
                        }, function reject () {
                            return Promise.reject();
                        });
                    }
                }

                debug() {
                    return $log.debug(this.preferences);
                }
            }

            return new PreferencesService();

        }
    ]);
