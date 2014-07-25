/**
 * Adapter wrapping browser localStorage.
 * Values are namespaced by default to avoid name collisions.
 */

import angular from 'angular';

angular.module('wfLocalStorageAdapter', [])
  .factory('wfLocalStorageAdapter', ['$log', function($log) {

    var DEFAULT_PREFIX = 'wf_';

    class LocalStorageAdapter {

      /**
       * Retrieve a value from localStorage.
       * @throws {Error} If localStorage is unavailable.
       * @return {String}
       */
      get(key, prefix = DEFAULT_PREFIX) {
        return window.localStorage.getItem(prefix + key);
      }

      /**
       * Retrieve and parse JSON stringified object from local storage.
       * @return {Object}
       */
      getObject(key, prefix) {
        var raw = this.get(key, prefix);

        if (!raw) { return; }

        return JSON.parse(raw);
      }

      /**
       * Store a value in localStorage.
       * @throws {Error} If localStorage is unavailable or full.
       */
      set(key, value, prefix = DEFAULT_PREFIX) {
        if (typeof(value) == 'object') {
          value = JSON.stringify(value);
        }

        window.localStorage.setItem(prefix + key, value);
      }
    }

    return new LocalStorageAdapter();

  }]);
