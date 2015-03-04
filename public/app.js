/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

import { getEnvironment } from 'environment';

import 'components/sentry/sentry';
import 'components/error-display/error-display';

import 'components/content-list/content-list';
import 'components/icons/icons';

import 'components/quick-add/quick-add';

import 'layouts/dashboard/dashboard';
import 'layouts/dashboard/dashboard-user';
import 'layouts/dashboard/dashboard-create';
import 'layouts/dashboard/dashboard-toolbar';
import 'layouts/dashboard/dashboard-sidebar';

import 'layouts/plan/plan';
import 'layouts/plan/plan-toolbar';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/column-service';
import 'lib/preferences-service';
import 'lib/analytics';
import 'lib/feature-switches';
import 'lib/google-api';
import 'lib/plan-service';
import 'lib/polling-service';

// 3rd party libs
import 'angular-ui-router';
import 'angular-bootstrap';
import 'angular-animate/angular-animate.min';

// App-wide Styles
import 'bootstrap@3.2.0/css/bootstrap.min.css!';
import 'main.min.css!';

angular.module('workflow',
    [
        'ui.router',
        'ngAnimate',
        'wfSentry',
        'wfErrorDisplay',
        'wfDashboard',
        'wfDashboardUser',
        'wfDashboardCreate',
        'wfDashboardToolbar',
        'wfDashboardSidebar',
        'wfIcons',
        'wfContentList',
        'wfDateService',
        'wfAnalytics',
        'wfFiltersService',
        'wfColumnService',
        'wfPreferencesService',
        'wfFeatureSwitches',
        'wfGoogleApiService',
        'wfPlan',
        'wfPlanToolbar',
        'wfQuickAdd'
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider ) {
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
                'view-create': {
                    templateUrl: '/assets/layouts/dashboard/dashboard-create.html',
                    controller: 'wfDashboardCreateController'
                },
                'view-user': {
                    templateUrl: '/assets/layouts/dashboard/dashboard-user.html',
                    controller: 'wfDashboardUserController'
                }
            }
        })
        .state('plan', {
                url: '/plan',
                views: {
                    '': {
                        templateUrl: '/assets/layouts/plan/plan.html',
                        controller: 'wfPlanController'
                    },
                    'view-toolbar': {
                        templateUrl: '/assets/layouts/plan/plan-toolbar.html',
                        controller: 'wfPlanToolbarController'
                    }
                }
            });

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
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
    .constant({ 'statusLabels': _wfConfig.statuses.map((status) => {

            if (status === 'Stub') {
                return {
                    label: 'News list',
                    value: 'Stub'
                }
            }

            return {
                label: status,
                value: status
            }
        })
    })
    .constant({ 'sections': _wfConfig.sections })
    .constant({ 'desks': _wfConfig.desks })
    .constant({ 'sectionsInDesks': _wfConfig.sectionsInDesks })
    .constant({ 'legalValues': [
        { name: 'Not required', value: 'NA' },
        { name: 'Needs checking', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ]})
    .constant({ 'priorities': [
        { name: 'Normal', value: 0 },
        { name: 'Urgent', value: 1 },
        { name: 'Very-Urgent', value: 2 }
    ]})

    .run(function ($window, wfGoogleApiService) {
        wfGoogleApiService.load();
    });

// Bootstrap App
angular.element(document).ready(function () {
    angular.bootstrap(document, ['workflow']);
    window.name='gu_workflow';
});
