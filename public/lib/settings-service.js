/**
 * Module containing a service providing User settings stored locally.
 *
 * Stores settings on the $rootScope as "globalSettings", which can be used in
 * scope reading/watching but should NOT be used for writing. Use this service for
 * writing as it ensures persistance to local storage.
 */

import angular from 'angular';

import './local-storage-adapter';

angular.module('wfSettingsService', ['wfLocalStorageAdapter'])
    .factory('wfSettingsService', ['$log', '$rootScope', 'wfLocalStorageAdapter', function ($log, $rootScope, localStorageAdapter) {

        class Settings {

            constructor() {
                var settings;
                try {
                    settings = localStorageAdapter.getObject('settings') || {};

                } catch (err) {
                    $log.error('Could not retrieve settings from localStorage: ' + err);
                    settings = {};
                }

                $rootScope.globalSettings = settings;

                // TODO: add listeners to local storage events
            }

            get(key) {
                return $rootScope.globalSettings[key];
            }

            /**
             * Set a setting. Persists in browser localStorage.
             */
            set(key, value) {
                $rootScope.globalSettings[key] = value;

                try {
                    localStorageAdapter.set('settings', $rootScope.globalSettings);

                } catch (err) {
                    // Silently fail on local storage error
                    $log.error('Error setting value in localStorage: ' + err);
                }

                return this;
            }

        }

        return new Settings();

    }]);

