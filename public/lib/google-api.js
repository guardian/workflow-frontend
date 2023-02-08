import angular from 'angular';

import googleAuthBannerTemplate from './templates/google-auth-banner.html';

const gisStorageKey = 'gis-token-info';

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

              try {
                const tokenInfo = JSON.parse($window.localStorage.getItem(gisStorageKey));
                this.accessTokenExpiresAt = new Date(tokenInfo.accessTokenExpiresAt);
                this.accessToken = tokenInfo.accessToken;
              } catch {}

              if (!this.accessToken || this._tokenIsExpired()) {
                // TODO correctly set the script load order
                const checkInterval = setInterval(() => {

                    if (!(typeof google === 'undefined')) {
                        clearInterval(checkInterval);
                        this.authInvis(this._handleInitialAuth);
                    }
                }, 500);
              }

            }

            _storeToken() {
              try {
                const tokenInfo = {
                  accessToken: this.accessToken,
                  accessTokenExpiresAt: this.accessTokenExpiresAt.getTime(),
                }
                $window.localStorage.setItem(gisStorageKey, JSON.stringify(tokenInfo));
              } catch {}
            }

            _handleInitialAuth (authResult)  {

                if (authResult && !authResult.error) {

                    console.info('Client authorised via google');
                    $rootScope.$emit('wfGoogleApiService.userIsAuthorized');
                } else if (authResult.error === 'popup_failed_to_open' || authResult.error === 'popup_closed') {

                    console.error('Authorisation failed, due to popup failing to open. Notifying user');
                    $rootScope.$emit('wfGoogleApiService.popupFailed');
                } else {

                    console.info('Client not authorised, triggering auth popup');
                    $rootScope.$emit('wfGoogleApiService.userIsNotAuthorized');
                }
            }

            expiresAt(tokenResponse) {
                const expiry = new Date();
                expiry.setTime(expiry.getTime() + (tokenResponse.expires_in * 1000));
                return expiry;
            }

            authInvis (callBack) {
                const client = google.accounts.oauth2.initTokenClient({
                  client_id: this.client_id,
                  scope: this.scope,
                  prompt: 'none',
                  callback: (res) => {
                    this.accessToken = res.access_token;
                    this.accessTokenExpiresAt = this.expiresAt(res);
                    this._storeToken();
                    callBack(res);
                  },
                  error_callback: (type) => {
                    callBack({ error: type });
                  },
                });

                client.requestAccessToken();
            }

            authPrompt () {
                const client = google.accounts.oauth2.initTokenClient({
                  client_id: this.client_id,
                  scope: this.scope,
                  prompt: '', // empty string The user will be prompted only the first time your app requests access.
                  callback: (res) => {
                    this.accessToken = res.access_token;
                    this.accessTokenExpiresAt = this.expiresAt(res);
                    this._storeToken();
                    this._handleInitialAuth(res);
                  },
                  error_callback: (type) => {
                    callBack({ error: type });
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
                        'Authorization': 'Bearer ' + this.accessToken
                    }
                };

                return $http(req).then((response) => {
                    return response.data.users;
                }, () => {
                    console.error('Could not query Google API for users');
                });
            }

            _tokenIsExpired (t) {
                return this.accessToken && // access token found and added to scope
                    this.accessTokenExpiresAt && // we have calculated expiration property
                    this.accessTokenExpiresAt <= new Date(); // expiry time is before now
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

                    if (this._tokenIsExpired()) {

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
            template: googleAuthBannerTemplate,
            link: ($scope, elem) => {

                $scope.banner = null;

                $scope.auth = function () {
                    wfGoogleApiService.authPrompt();
                };

                $rootScope.$on('wfGoogleApiService.userIsNotAuthorized', () => {
                    $scope.banner = 'unauthorized';
                });

                $rootScope.$on('wfGoogleApiService.popupFailed', () => {
                    $scope.banner = 'popup';
                });

                $rootScope.$on('wfGoogleApiService.userIsAuthorized', () => {
                    $scope.banner = null;
                });
            }
        }
    }]);
