
import angular from 'angular';
import './analytics/mixpanel-adapter';
import UAParser from 'ua-parser/ua-parser.min';

import './user';

angular.module('wfAnalytics', ['wfUser'])

  .factory('wfAnalytics', ['wfUser', function(wfUser) {

    class Analytics {

      init() {
        mixpanel.init('5db5be65ee7d6c82a730a4cbec2465f2');
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
  .run(['wfAnalytics', function(wfAnalytics) {

    wfAnalytics.init();

    wfAnalytics.track('Dashboard loaded');

    // TODO Things to track:
    //  Stub created
    //  Content edited
    //  Status changed
    //    Stub->Writers
    //  View in Composer
    //  Content list filtered

  }]);
