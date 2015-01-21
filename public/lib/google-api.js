import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', '$http', function ($window, $http) {

        return {
            load: function () {

                if (typeof gapi.client === 'undefined') {

                    setTimeout(load, 500);
                } else {

                    var config = {
                        'client_id': '715812401369-s2qbnkoiaup21bocaarrbf0mpat2ifjk.apps.googleusercontent.com',
                        'scope': 'https://www.googleapis.com/auth/admin.directory.user.readonly',
                        immediate: true
                    };
                    gapi.auth.authorize(config, function() {

                        window.gapi.auth = gapi.auth.getToken();
                    });
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
