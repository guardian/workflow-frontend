/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

import { getEnvironment } from './environment';

import 'components/sentry/sentry';
import 'components/user-message/user-message';

import 'components/content-list/content-list';
import 'components/icons/icons';


import 'layouts/dashboard/dashboard';
import 'layouts/dashboard/dashboard-user';
import 'layouts/dashboard/dashboard-create';
import 'layouts/dashboard/dashboard-toolbar';
import 'layouts/dashboard/dashboard-sidebar';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/column-service';
import 'lib/preferences-service';
import 'lib/feature-switches';
import 'lib/google-api';
import 'lib/polling-service';
import 'lib/title-service';
import 'lib/logger';

// 3rd party libs
import 'angular-ui-router';
import 'angular-bootstrap-temporary';
import 'angular-animate';
import 'ng-infinite-scroll';

// App-wide Styles
import './main.scss';

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
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider', '$animateProvider', "$provide", function ($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider, $animateProvider, $provide) {
        // TODO: remember user's state and redirect there on default '' route
        $urlRouterProvider.when('', '/dashboard');

        $animateProvider.classNameFilter(/^((?!(day-view__item)).)*$/); // https://github.com/angular/angular.js/issues/3613#issuecomment-86704187

        function sanitizeExportUrl(url) {
            return RegExp($compileProvider.aHrefSanitizationWhitelist().source +
                   "|^\\s*" + url.match("^.*?:")[0])
        }
        $compileProvider.aHrefSanitizationWhitelist(
            sanitizeExportUrl(_wfConfig.incopyExportUrl)
        );

        $compileProvider.aHrefSanitizationWhitelist(
            sanitizeExportUrl(_wfConfig.indesignExportUrl)
        );

        $provide.decorator('$log', ["$delegate", 'logger', function ($delegate, logger) {

            $delegate.error = function (...args) {
                args.splice(1,0,"ERROR")
                logger.log.apply(null, args);
            };

            $delegate.warn = function (...args) {
                args.splice(1,0,"WARN")
                logger.log.apply(null, args);
            };

            $delegate.info = function (...args) {
                args.splice(1,0,"INFO")
                logger.log.apply(null, args);
            };

            $delegate.debug = function (...args) {
                args.splice(1,0,"DEBUG")
                logger.log.apply(null, args);
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
            'viewerUrl': _wfConfig.viewerUrl,
            'presenceUrl': _wfConfig.presenceUrl,
            'incopyExportUrl': _wfConfig.incopyExportUrl,
            'indesignExportUrl': _wfConfig.indesignExportUrl,
            'composerRestorerUrl': _wfConfig.composerRestorerUrl,
            'maxNoteLength': 500,
            'mediaAtomMakerNewAtom': _wfConfig.mediaAtomMaker.create,
            'mediaAtomMakerViewAtom': _wfConfig.mediaAtomMaker.view,
            'atomWorkshopNewAtom': _wfConfig.atomWorkshop.create,
            'atomWorkshopViewAtom': _wfConfig.atomWorkshop.view,
            'atomTypes': _wfConfig.atomTypes
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
        { name: 'Very-Low', value: -2 },
        { name: 'Low', value: -1 },
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
