/**
 * Module containing a service providing User settings stored locally.
 */

import angular from 'angular';

import './local-storage-adapter';

angular.module('wfSettingsService', ['wfLocalStorageAdapter'])
    .factory('wfSettingsService', ['$log', 'wfLocalStorageAdapter', function ($log, localStorageAdapter) {

        class Settings {

            constructor() {
                try {
                    this._settings = localStorageAdapter.getObject('settings') || {};

                } catch (err) {
                    $log.error('Could not retrieve settings from localStorage: ' + err);
                    this._settings = {};
                }

                // TODO: add listeners to local storage events
            }

            get(key) {
                return this._settings[key];
            }

            /**
             * Set a setting. Persists in browser localStorage.
             */
            set(key, value) {
                this._settings[key] = value;

                try {
                    localStorageAdapter.set('settings', this._settings);

                } catch (err) {
                    // Silently fail on local storage error
                    $log.error('Error setting value in localStorage: ' + err);
                }

                return this;
            }

        }

        return new Settings();

    }]);
