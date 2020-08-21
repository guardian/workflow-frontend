define(['angular'], function (angular) {
    'use strict';

    var pictureDeskStatesService = angular.module('pictureDeskStatesService', []);

    pictureDeskStatesService.factory('pictureDeskStatesService',
        [function () {

            function getPictureDeskStatus() {
                return [
                    {name: 'Not required', value: 'NA'},
                    {name: 'Needs checking', value: 'REQUIRED'},
                    {name: 'Checked', value: 'COMPLETE'}
                ]
            };

            return {
                getpictureDeskStates: getPictureDeskStatus
            };

        }]);

    return pictureDeskStatesService;
});
