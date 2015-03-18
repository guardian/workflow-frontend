import angular from 'angular';


angular.module('wfTitleService', [])
    .factory('wfTitleService', [function() {

        class TitleService
        {
            set(title) {
                document.title = title;
            }
        }

        return new TitleService();

    }]);
