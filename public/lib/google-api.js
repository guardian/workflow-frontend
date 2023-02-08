import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', '$http', '$rootScope', function ($window, $http, $rootScope) {

        class ApiService {

            constructor () {
                this.scope = 'https://www.googleapis.com/auth/admin.directory.user.readonly';
                this.client_id = '715812401369-s2qbnkoiaup21bocaarrbf0mpat2ifjk.apps.googleusercontent.com';
            }

            /**
             * If the client had already authorised then authorize invisibly with prompt: none, else trigger auth pop up
             */
            load () {

                // TODO correctly set the script load order
                const checkInterval = setInterval(() => {

                    if (!(typeof google === 'undefined')) {
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

            expiresAt(tokenResponse) {
                const expiry = new Date();
                expiry.setSeconds(expiry.getSeconds() + tokenResponse.expires_in);
                return expiry;
            }

            authInvis (callBack) {
                const client = google.accounts.oauth2.initTokenClient({
                  client_id: this.client_id,
                  scope: this.scope,
                  prompt: 'none',
                  callback: (res) => {
                    this.tokenResponse = res;
                    this.tokenResponse.expiresAt = expiresAt(res);
                    callBack(res);
                  },
                });

                client.requestAccessToken();
            }

            authPrompt () {
                const client = google.accounts.oauth2.initTokenClient({
                  client_id,
                  scope,
                  prompt: 'none',
                  callback: (res) => {
                    this.tokenResponse = res;
                    this.tokenResponse.expiresAt = expiresAt(res);
                    this.handleAuthResult(res);
                  },
                });

                client.requestAccessToken();
            }

            requestUserList (query) {

                const req = {
                    method: 'GET',
                    url: 'https://www.googleapis.com/admin/directory/v1/users',
                    params: {
                        query: query,
                        domain: 'guardian.co.uk',
                        viewType: 'domain_public'
                    },
                    headers: {
                        'Authorization': 'Bearer ' + this.tokenResponse.access_token
                    }
                };

                return $http(req).then((response) => {
                    return response.data.users;
                }, () => {
                    console.error('Could not query Google API for users');
                });
            }

            _tokenIsExpired (t) {
                return t && // token exists
                    t.expiresAt && // we have calculated expiration property
                    t.expiresAt <= new Date(); // expiry time is before noe
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

                    if (this._tokenIsExpired(this.tokenResponse)) {

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
            template: '<div class="alert alert-info" ng-if="visible">To assign content to yourself or other people, you\'ll need to <button class="btn btn-xs btn-primary " ng-click="auth()">Authorise Workflow</button> access your Google contacts.</div>',
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
