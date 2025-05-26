import angular from 'angular';

angular.module('legalStatesService', [])
    .factory('legalStatesService', [function () {
        function getLegalStates() {
            return [
                {name: 'Not required', value: 'NA'},
                {name: 'Needs checking', value: 'REQUIRED'},
                {name: 'Approved', value: 'COMPLETE'}
            ]
        };

        return {
            getLegalStates: getLegalStates
        };
    }]);

export default angular.module('legalStatesService');
