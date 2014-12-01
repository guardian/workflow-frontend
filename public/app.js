/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

// Legacy:
// import 'javascripts/services';
// import 'javascripts/directives';
// import 'javascripts/controllers';
// import 'javascripts/controllers/dashboard';
// import 'javascripts/controllers/dashboard/content-item';
// import 'javascripts/controllers/dashboard/dashboard';
// import 'javascripts/controllers/dashboard/date-filter';
// import 'javascripts/controllers/dashboard/stub-crud';
// import 'javascripts/services/legal-states-service';
// import 'javascripts/services/prodoffice-service';

import { getEnvironment } from 'environment';

import 'components/sentry/sentry';

import 'components/content-list/content-list';
import 'components/icons/icons';

import 'layouts/dashboard/dashboard';
import 'layouts/dashboard/dashboard-user';
import 'layouts/dashboard/dashboard-toolbar';
import 'layouts/dashboard/dashboard-sidebar';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/analytics';
import 'lib/feature-switches';

// 3rd party libs
import 'angular-ui-router';
import 'angular-bootstrap';
import 'angular-xeditable';
import 'angular-animate/angular-animate.min';

// App-wide Styles
import 'bootstrap@3.2.0/css/bootstrap.min.css!';
import 'main.min.css!';

angular.module('workflow',
    [
        'ui.router',
        'ngAnimate',
        'wfSentry',
        'wfDashboard',
        'wfDashboardUser',
        'wfDashboardToolbar',
        'wfDashboardSidebar',
        'wfIcons',
        'wfContentList',
        'wfDateService',
        'wfAnalytics',
        'wfFiltersService',
        'wfFeatureSwitches',
        'xeditable'
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', function ($stateProvider, $urlRouterProvider, $compileProvider) {
        // TODO: remember user's state and redirect there on default '' route
        $urlRouterProvider.when('', '/dashboard');

        $compileProvider.aHrefSanitizationWhitelist(
            RegExp($compileProvider.aHrefSanitizationWhitelist().source +
                   "|^\\s*" + _wfConfig.incopyExportUrl.match("^.*?:")[0])
        );

        $stateProvider.state('dashboard', {
            url: '/dashboard',
            views: {
                '': {
                    templateUrl: '/assets/layouts/dashboard/dashboard.html',
                    controller: 'wfDashboardController'
                },
                'view-toolbar': {
                    templateUrl: '/assets/layouts/dashboard/dashboard-toolbar.html',
                    controller: 'wfDashboardToolbarController'
                },
                'view-user': {
                    templateUrl: '/assets/layouts/dashboard/dashboard-user.html',
                    controller: 'wfDashboardUserController'
                }
            }
        });

    }])

    // Environment specific globals
    .constant('wfEnvironment', getEnvironment())

    // Global config
    .constant(
        'config',
        {
            'composerNewContent': _wfConfig.composer.create,
            'composerViewContent': _wfConfig.composer.view,
            'composerContentDetails': _wfConfig.composer.details,
            'presenceUrl': _wfConfig.presenceUrl,
            'incopyExportUrl': _wfConfig.incopyExportUrl,
            'maxNoteLength': 500
        }
    )
    .constant({ 'statuses': _wfConfig.statuses })
    .constant({ 'sections': _wfConfig.sections })
    .constant({ 'desks': _wfConfig.desks })
    .constant({ 'sectionsInDesks': _wfConfig.sectionsInDesks })

    // XEditable options, TODO: mode out to dashboard controller somewhere...
    .run(function (editableOptions) {
        editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
    });

// Bootstrap App
angular.element(document).ready(function () {
    angular.bootstrap(document, ['workflow']);
});
