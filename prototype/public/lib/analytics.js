
import angular from 'angular';
import './analytics/mixpanel-adapter';
import UAParser from 'ua-parser/ua-parser.min';

import './user';

angular.module('wfAnalytics', ['wfUser'])

  .factory('wfAnalytics', ['wfUser', function(wfUser) {

    function getMixpanelToken() {
      if (window.location.hostname == 'workflow.gutools.co.uk') {
        return '8bed1eea7b1ff4e758ae8fbc60968d26';
      }
      return '5db5be65ee7d6c82a730a4cbec2465f2';
    }

    class Analytics {

      init() {
        mixpanel.init(getMixpanelToken());
        mixpanel.identify(wfUser.email);
        mixpanel.people.set({
          '$email': wfUser.email,
          '$first_name': wfUser.firstName,
          '$last_name': wfUser.lastName
        });
      }

      track(eventName, properties = {}) {

        var ua = new UAParser(), // parse the user agent
            browser = ua.getBrowser(),
            os = ua.getOS();

        angular.extend(properties, {
          'Browser version': browser.name + ' ' + browser.major,
          'Operating System version': os.name + ' ' + os.version,
          'Screen resolution': window.screen.width + ' x ' + window.screen.height,
          'Screen viewport': document.documentElement.clientWidth + ' x ' + document.documentElement.clientHeight
        });

        mixpanel.track(eventName, properties);
      }

    }

    return new Analytics();
  }])

  // Initialise and attach event listeners on load (run)
  .run(['$rootScope', 'wfAnalytics', function($rootScope, wfAnalytics) {

    wfAnalytics.init();

    wfAnalytics.track('Dashboard loaded');

    // Track Stub created
    $rootScope.$on('stub.created', function(event, data) {
      wfAnalytics.track('Stub created', {
        'Section': data.section,
        'Content type': data.contentType,
        'Created in Composer': !!data.composerId
      });
    });

    // Track stub edited
    $rootScope.$on('stub.edited', function(event, data) {
      wfAnalytics.track('Stub edited', {
        'Section': data.section,
        'Content type': data.contentType
      });
    });

    // Track stub/content status change
    $rootScope.$on('content.status.changed', function(event, data) {
      wfAnalytics.track('Status changed', {
        'Section': data.content.section,
        'Content type': data.content.contentType,
        'Status transition': data.oldStatus + ' to ' + data.status
      });
    });

    // Track import from composer
    $rootScope.$on('content.import', function(event, data) {
      wfAnalytics.track('Content imported', {
        'Section': data.content.section,
        'Content type': data.content.contentType
      });
    });

    // TODO Things to track:
    //  Content edited
    //  Content / Stub deleted
    //  View in Composer
    //  Content list filtered

  }]);
