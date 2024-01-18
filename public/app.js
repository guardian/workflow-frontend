/**
 * Main JS module for Workflow's angular app.
 */

import angular from 'angular';

import { getEnvironment } from './environment';
import { registerServiceWorker } from './lib/notifications';

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
import 'lib/analytics';
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
        'wfAnalyticsServiceMod',
        'infinite-scroll',
        'wfTitleService',
        'logger',

        // New

        //'angular-loading-bar',
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider', '$animateProvider', "$provide", "$httpProvider", function ($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider, $animateProvider, $provide, $httpProvider) {
        // TODO: remember user's state and redirect there on default '' route
        $urlRouterProvider.when('', '/dashboard');

        $animateProvider.classNameFilter(/^((?!(day-view__item)).)*$/); // https://github.com/angular/angular.js/issues/3613#issuecomment-86704187

        function sanitizeUrl(url) {
            return RegExp($compileProvider.aHrefSanitizationWhitelist().source +
                   "|^\\s*" + url.match("^.*?:")[0])
        }

        $compileProvider.aHrefSanitizationWhitelist(
            sanitizeUrl(_wfConfig.incopyOpenUrl)
        );

        $compileProvider.aHrefSanitizationWhitelist(
            sanitizeUrl(_wfConfig.incopyExportUrl)
        );

        $compileProvider.aHrefSanitizationWhitelist(
            sanitizeUrl(_wfConfig.indesignExportUrl)
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

        // Use a custom header for the csrf token.
        // `Csrf-Token` is what Play looks for by default.
        // See https://www.playframework.com/documentation/2.7.x/ScalaCsrf#Plays-CSRF-protection
        // See https://code.angularjs.org/1.5.11/docs/api/ng/service/$http#usage
        $httpProvider.defaults.xsrfHeaderName = 'Csrf-Token';
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
            'composerTemplates': _wfConfig.composer.templates,
            'viewerUrl': _wfConfig.viewerUrl,
            'storyPackagesUrl': _wfConfig.storyPackagesUrl,
            'presenceUrl': _wfConfig.presenceUrl,
            'incopyOpenUrl': _wfConfig.incopyOpenUrl,
            'incopyExportUrl': _wfConfig.incopyExportUrl,
            'indesignExportUrl': _wfConfig.indesignExportUrl,
            'composerRestorerUrl': _wfConfig.composerRestorerUrl,
            'maxNoteLength': 500,
            'mediaAtomMakerNewAtom': _wfConfig.mediaAtomMaker.create,
            'mediaAtomMakerViewAtom': _wfConfig.mediaAtomMaker.view,
            'atomWorkshopNewAtom': _wfConfig.atomWorkshop.create,
            'atomWorkshopViewAtom': _wfConfig.atomWorkshop.view,
            'atomTypes': _wfConfig.atomTypes,
            'sessionId': _wfConfig.sessionId,
            'gaId': _wfConfig.googleTrackingId
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
    .constant({ 'priorities': _wfConfig.priorities })
    .constant({ 'sectionsInDesks': _wfConfig.sectionsInDesks })
    .constant({ 'legalValues': [
        { name: 'Not required', value: 'NA' },
        { name: 'Needs checking', value: 'REQUIRED' },
        { name: 'Approved', value: 'COMPLETE'}
    ]})
    .constant({ 'pictureDeskValues': [
        { name: 'Not required', value: 'NA' },
        { name: 'Needs checking', value: 'REQUIRED' },
        { name: 'Checked', value: 'COMPLETE'}
    ]})

    .run(['wfAnalyticsService', function(){}])
    .run(['$document', '$rootScope', function ($document, $rootScope) {
        $document.on('keydown', function(event) {
            if (event.shiftKey && event.keyCode === 123) {            
              $rootScope.$apply(function() {
                $rootScope.showFeatureSwitch = !$rootScope.showFeatureSwitch;
            })}
        });
    }]);


registerServiceWorker();

// Bootstrap App
angular.element(document).ready(function () {
    angular.bootstrap(document, ['workflow']);
    window.name='gu_workflow';
});
