import angular from 'angular';


angular.module('wfTitleService', [])
    .factory('wfTitleService', [function() {

        class TitleService
        {
            set(titlePrefix) {
                document.title = titlePrefix + ' - Workflow';
            }
        }

        return new TitleService();

    }]);
