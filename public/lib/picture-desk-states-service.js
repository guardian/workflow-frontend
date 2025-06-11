import angular from 'angular';

angular.module('pictureDeskStatesService', [])
    .factory('pictureDeskStatesService', [function () {
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

export default angular.module('pictureDeskStatesService');
