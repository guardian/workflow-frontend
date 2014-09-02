/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

// Legacy:
import 'javascripts/services';
import 'javascripts/directives';
import 'javascripts/controllers';
import 'javascripts/controllers/dashboard';
import 'javascripts/controllers/dashboard/content-item';
import 'javascripts/controllers/dashboard/dashboard';
import 'javascripts/controllers/dashboard/date-filter';
import 'javascripts/controllers/dashboard/stub-crud';
import 'javascripts/services/composer-service';
import 'javascripts/services/legal-states-service';
import 'javascripts/services/prodoffice-service';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/analytics';

// 3rd party libs
import 'angular-bootstrap';
import 'angular-xeditable';
import 'angular-route';
import 'angular-animate/angular-animate.min';

// App-wide Styles
import 'bootstrap@3.2.0/css/bootstrap.min.css!';
import 'main.css!';


angular.module('workflow',
  [
    'ngRoute',
    'ngAnimate',
    'dashboardControllers',
    'wfDateService',
    'wfAnalytics',
    'workflow.services',
    'workflow.directives',
    'workflow.controllers',
    'composerService',
    'legalStatesService',
    'prodOfficeService',
    'wfFiltersService',
    'xeditable'
  ])

  // Routes
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/dashboard', { templateUrl: 'dashboard',
                                        controller: 'DashboardCtrl',
                                        reloadOnSearch: false
                                       });
    $routeProvider.otherwise({redirectTo: '/dashboard'});
  }])


  // Global config
  .constant(
    'config',
    {
      'composerNewContent': _wfConfig.composer.create,
      'composerViewContent': _wfConfig.composer.view,
      'composerContentDetails': _wfConfig.composer.details,
      'maxNoteLength': 500
    }
  )
  .constant({ 'statuses': _wfConfig.statuses })
  .constant({ 'sections': _wfConfig.sections })

  // XEditable options, TODO: mode out to dashboard controller somewhere...
  .run(function(editableOptions) {
      editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  });


// Bootstrap App
angular.element(document).ready(function() {
  angular.bootstrap(document, ['workflow']);
});
