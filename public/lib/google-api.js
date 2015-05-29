import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', '$http', '$rootScope', function ($window, $http, $rootScope) {

        var scope = 'https://www.googleapis.com/auth/admin.directory.user.readonly',
            client_id = '715812401369-s2qbnkoiaup21bocaarrbf0mpat2ifjk.apps.googleusercontent.com';

        var apiService = {

            /**
             * If the client had already authorised then authorize invisibly with immediate: true, else trigger auth pop up
             */
            load: function () {

                var checkInterval = setInterval(() => {

                    if (!(typeof gapi === 'undefined') && !(typeof gapi.client === 'undefined')) {

                        clearInterval(checkInterval);
                        checkAuth();
                    }
                }, 500);

                function checkAuth () {

                    gapi.auth.authorize({
                        'client_id': client_id,
                        'scope': scope,
                        immediate: true
                    }, apiService.handleAuthResult);
                }

            },

            handleAuthResult: (authResult) => {

                if (authResult && !authResult.error) {

                    console.info('Client authorised via google');
                    $rootScope.$emit('wfGoogleApiService.userIsAuthorized');
                    window.gapi.auth = gapi.auth.getToken();
                } else {

                    console.info('Client not authorised, triggering auth popup');
                    $rootScope.$emit('wfGoogleApiService.userIsNotAuthorized');
                }
            },

            authPrompt: () => {

                gapi.auth.authorize({
                    'client_id': client_id,
                    'scope': scope,
                    immediate: false
                }, apiService.handleAuthResult);
            },

            /**
             * Search for users via google api
             *
             * TODO: refactor in to separate service
             *
             * @param value search term
             * @returns $http promise
             */
            searchUsers: function (value) {

                var req = {
                    method: 'GET',
                    url: 'https://www.googleapis.com/admin/directory/v1/users',
                    params: {
                        query: value,
                        domain: 'guardian.co.uk',
                        viewType: 'domain_public'
                    },
                    headers: {
                        'Authorization': 'Bearer ' + window.gapi.auth['access_token']
                    }
                };

                return $http(req).then((response) => {
                    return response.data.users;
                }, () => {
                    console.error('Could not query Google API for users');
                });
            }
        };

        return apiService;

    }]).directive('googleAuthBanner', ['wfGoogleApiService', '$rootScope', function (wfGoogleApiService, $rootScope) {

        return {
            restrict: 'E',
            scope: {},
            template: '<div class="alert alert-info" ng-if="visible">Workflow can now read your contacts! <button class="btn btn-xs btn-primary " ng-click="auth()">Authorise Workflow</button></div>',
            link: ($scope, elem) => {

                $scope.visible = false;

                $scope.auth = function () {

                    wfGoogleApiService.authPrompt();
                };

                $rootScope.$on('wfGoogleApiService.userIsNotAuthorized', () => {

                    $scope.visible = true;
                });

                $rootScope.$on('wfGoogleApiService.userIsAuthorized', () => {

                    $scope.visible = false;
                });
            }
        }
    }]);
