import angular from 'angular';
import moment from 'moment';

angular.module('wfPreferencesService', [])
    .factory('wfPreferencesService', ['$rootScope', '$http', '$log',
        function($rootScope, $http, $log) {

            class PreferencesService {

                /**
                 * Constructor for prefs service. Set users email locally and kick off retrieval of users prefs
                 * from prefs app
                 */
                constructor() {

                    this.user = _wfConfig.user.email;

                    this.prefsPromise = this.retrievePrefrences().then(function success (data) {
                        self.preferences = data.data;
                        return self.preferences;
                    }, function error () {
                        $log.error("Could not fetch preferences", arguments);
                        return Promise.reject();
                    });
                }

                /**
                 * Return a request url using the app config
                 * @param path String
                 * @returns {String} url
                 */
                url(path) {
                    return _wfConfig.preferencesUrl + path;
                }

                /**
                 * Return a promise of an http request to the preferences application for the users entire preference object
                 * @returns {HttpPromise}
                 */
                retrievePrefrences() {
                    return $http.get(this.url("/preferences/" + this.user), {
                        withCredentials: true,
                        transformResponse: this.transformResponse // custom transform on data
                    });
                }

                /**
                 * Perform a cusom parse on returned preference data as we only care about the users prefs for workflow
                 * and want the data pre-parsed in to js objects ready for use
                 * @param data
                 * @param headersGetter
                 * @returns {Object} Parsed preference data narrowed to workflow prefs only
                 */
                transformResponse(data, headersGetter) {
                    data = JSON.parse(data).data;
                    var wfPrefs = data.preferences.workflow; // strip out all but WF prefs
                    for (var key in wfPrefs) {
                        if (wfPrefs.hasOwnProperty(key)) {
                            wfPrefs[key] = JSON.parse(wfPrefs[key]); // Parse all values to js objects
                        }
                    }
                    return wfPrefs;
                }

                /**
                 * Helper method to package data in format expected by preferences app
                 * @param data
                 * @returns {{data: {value: *, namespace: string}}}
                 */
                packageData(data) {
                    return {
                        data: {
                            value: JSON.stringify(data),
                            namespace: "workflow"
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
                    return $http.post(
                        this.url("/preference/" + name),
                        this.packageData(data),
                        {
                            withCredentials: true
                        }
                    );
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
                        return Promise.resolve(this.preferences[name]);
                    } else {
                        return this.prefsPromise.then(function resolve (data) {
                            return data[name];
                        }, function reject () {
                            return Promise.reject();
                        });
                    }
                }
            }

            return new PreferencesService();

        }
    ]);
