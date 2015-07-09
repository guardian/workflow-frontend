import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', '$http', '$rootScope', function ($window, $http, $rootScope) {

        class ApiService {

            constructor () {
                this.scope = 'https://www.googleapis.com/auth/admin.directory.user.readonly';
                this.client_id = '715812401369-s2qbnkoiaup21bocaarrbf0mpat2ifjk.apps.googleusercontent.com';
            }

            /**
             * If the client had already authorised then authorize invisibly with immediate: true, else trigger auth pop up
             */
            load () {

                var checkInterval = setInterval(() => {

                    if (!(typeof gapi === 'undefined') && !(typeof gapi.client === 'undefined')) {

                        clearInterval(checkInterval);
                        this.authInvis(this.handleAuthResult);
                    }
                }, 500);

            }

            handleAuthResult (authResult)  {

                if (authResult && !authResult.error) {

                    console.info('Client authorised via google');
                    $rootScope.$emit('wfGoogleApiService.userIsAuthorized');
                } else {

                    console.info('Client not authorised, triggering auth popup');
                    $rootScope.$emit('wfGoogleApiService.userIsNotAuthorized');
                }
            }

            authInvis (callBack) {

                return gapi.auth.authorize({
                    'client_id': this.client_id,
                    'scope': this.scope,
                    immediate: true
                }, callBack);
            }

            authPrompt () {

                gapi.auth.authorize({
                    'client_id': this.client_id,
                    'scope': this.scope,
                    immediate: false
                }, apiService.handleAuthResult);
            }

            requestUserList (query) {

                var req = {
                    method: 'GET',
                    url: 'https://www.googleapis.com/admin/directory/v1/users',
                    params: {
                        query: query,
                        domain: 'guardian.co.uk',
                        viewType: 'domain_public'
                    },
                    headers: {
                        'Authorization': 'Bearer ' + window.gapi.auth.getToken()['access_token']
                    }
                };

                return $http(req).then((response) => {
                    return response.data.users;
                }, () => {
                    console.error('Could not query Google API for users');
                });
            }

            /**
             * Search for users via google api
             *
             * TODO: refactor in to separate service
             *
             * @param query search term
             * @returns Promise
             */
            searchUsers (query) {

                // Handle re-auth if necessary

                return new Promise((resolve, reject) => {

                    if (new Date(parseInt(gapi.auth.getToken()['expires_at'], 10)*1000) <= new Date()) {

                        // re-auth
                        this.authInvis((authResult) => {

                            if (authResult && !authResult.error) {

                                resolve(this.requestUserList(query));
                            } else {

                                reject({msg: 'Could not re-authorise...'});
                            }
                        });
                    } else {
                        resolve(this.requestUserList(query));
                    }
                });
            }
        }

        return new ApiService();

    }]).directive('googleAuthBanner', ['wfGoogleApiService', '$rootScope', function (wfGoogleApiService, $rootScope) {

        return {
            restrict: 'E',
            scope: {},
            template: '<div class="alert alert-info" ng-if="visible">To assign content to yourself other people, you'll need to <button class="btn btn-xs btn-primary " ng-click="auth()">Authorise Workflow</button> access your Google contacts.</div>',
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
