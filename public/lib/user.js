/**
 * User Module. Provides the "wfUser" service containing data fields for the
 * current signed in user.
 *
 * @example
 * angular.module('myModule', 'wfUser')
 *   .controller('myController', ['wfUser', function(wfUser) {
 *     var email = wfUser.email;
 *     var lastName = wfUser.lastName;
 *     var firstName = wfUser.firstName;
 *   }]);
 */

import angular from 'angular';

angular.module('wfUser', [])
  .factory('wfUser', [function() {
    return window._wfConfig.user || {};
  }]);
