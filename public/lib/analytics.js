
import angular from 'angular';
import './analytics/mixpanel-adapter';

import './user';

angular.module('wfAnalytics', ['wfUser'])

  .run(['wfUser', function(wfUser) {

    mixpanel.init('5db5be65ee7d6c82a730a4cbec2465f2');
    mixpanel.identify(wfUser.email);
    mixpanel.people.set({
      '$email': wfUser.email,
      '$first_name': wfUser.firstName,
      '$last_name': wfUser.lastName
    });

    mixpanel.track('Dashboard loaded');

  }]);
