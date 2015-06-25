/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

import { getEnvironment } from 'environment';

import 'components/sentry/sentry';
import 'components/user-message/user-message';

import 'components/content-list/content-list';
import 'components/icons/icons';

import 'components/plan-view/quick-add/quick-add';

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
import 'lib/polling-service';
import 'lib/title-service';
import 'lib/logger';

// Plan view specific
import 'lib/plan-service';
import 'lib/bundle-service';
import 'lib/planned-item-service';
import 'lib/day-note-service';

// 3rd party libs
import 'angular-ui-router';
import 'angular-bootstrap';
import 'angular-animate/angular-animate.min';
import 'ngInfiniteScroll/ng-infinite-scroll';

//import 'angular-loading-bar';
//import 'angular-loading-bar@0.7.1/src/loading-bar.css!';

// App-wide Styles
import 'bootstrap@3.2.0/css/bootstrap.min.css!';
import 'main.min.css!';

angular.module('workflow',
    [
        'ui.router',
        'ngAnimate',
        'wfSentry',
        'wfUserMessage',
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
        'infinite-scroll',
        'wfTitleService',
        'logger',

        // New

        //'angular-loading-bar',

        // Plan view specific

        'wfPlan',
        'wfPlanToolbar',
        'wfQuickAdd',
        'wfBundleService',
        'wfPlannedItemService',
        'wfDayNoteService'
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider', '$animateProvider', "$provide", function ($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider, $animateProvider, $provide) {
        // TODO: remember user's state and redirect there on default '' route
        $urlRouterProvider.when('', '/dashboard');

        $animateProvider.classNameFilter(/^((?!(day-view__item)).)*$/); // https://github.com/angular/angular.js/issues/3613#issuecomment-86704187

        $compileProvider.aHrefSanitizationWhitelist(
            RegExp($compileProvider.aHrefSanitizationWhitelist().source +
                   "|^\\s*" + _wfConfig.incopyExportUrl.match("^.*?:")[0])
        );

        $provide.decorator('$log', ["$delegate", 'logger', function ($delegate, logger) {

            var warn = $delegate.warn;
            var info = $delegate.info;
            var debug = $delegate.debug;

            $delegate.warn = function () {
                var args = Array.prototype.slice.call(arguments);
                logger.log(args, "WARN");
                warn.apply(null, args);
            };

            $delegate.info = function () {
                var args = Array.prototype.slice.call(arguments);
                logger.log(args, "INFO");
                info.apply(null, args);
            };

            $delegate.debug = function () {
                var args = Array.prototype.slice.call(arguments);
                logger.log(args, "DEBUG");
                debug.apply(null, args);
            };

            return $delegate;
        }]);

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
            'composerRestorerUrl': _wfConfig.composerRestorerUrl,
            'maxNoteLength': 500,
            'pvPlanItemMaxNoteLength': 1000
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
