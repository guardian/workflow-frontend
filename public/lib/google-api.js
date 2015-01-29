import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', '$http', function ($window, $http) {

        return {

            /**
             * If the client had already authorised then authorize invisibly with immediate: true, else trigger auth pop up
             */
            load: function () {

                var scope = 'https://www.googleapis.com/auth/admin.directory.user.readonly',
                    client_id = '715812401369-s2qbnkoiaup21bocaarrbf0mpat2ifjk.apps.googleusercontent.com';

                if (typeof gapi.client === 'undefined') {

                    setTimeout(load, 500);
                } else {

                    checkAuth();
                }

                function checkAuth () {

                    gapi.auth.authorize({
                        'client_id': client_id,
                        'scope': scope,
                        immediate: true
                    }, handleAuthResult);
                }

                function authPrompt () {

                    gapi.auth.authorize({
                        'client_id': client_id,
                        'scope': scope,
                        immediate: false
                    }, handleAuthResult);
                }

                function handleAuthResult (authResult) {

                    if (authResult && !authResult.error) {

                        console.info('Client authorised via google');
                        window.gapi.auth = gapi.auth.getToken();
                    } else {

                        console.info('Client not authorised, triggering auth popup');
                        authPrompt();
                    }
                }
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

                var url = 'https://www.googleapis.com/admin/directory/v1/users',
                    searchParam = '?query=' + escape(value),
                    otherParams = '&domain=guardian.co.uk&viewType=domain_public';

                var searchUrl = url + searchParam + otherParams;

                var req = {
                    method: 'GET',
                    url: searchUrl,
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
    }]);
