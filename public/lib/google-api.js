import angular from 'angular';

angular.module('wfGoogleApiService', [])
    .service('wfGoogleApiService', ['$window', function ($window) {

        return {
            load: function load() {

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
            }
        };
    }]);
