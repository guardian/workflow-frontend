/**
 * Module containing a service providing User settings stored locally.
 */

import './local-storage-adapter';

angular.module('wfSettingsService', ['wfLocalStorageAdapter'])
  .factory('wfSettingsService', ['wfLocalStorageAdapter', function(localStorageAdapter) {

    class Settings {

      constructor() {
        this._settings = localStorageAdapter.getObject('settings') || {};

        // TODO: add listeners to local storage events
      }

      get(key) {
        return this._settings[key];
      }

      set(key, value) {
        this._settings[key] = value;
        localStorageAdapter.set('settings', this._settings);
        return this;
      }

    }

    return new Settings();

  }]);
