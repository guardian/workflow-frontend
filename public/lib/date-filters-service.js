import angular from 'angular';
import moment from 'moment';

angular.module('dateFilters', []).factory('dateFilters', [function(){

    class DateFilters {

        setToAndFrom(date) {
            var dateParams = {};
            if (date == 'today') {
                dateParams['due.from'] = moment().startOf('day');
                dateParams['due.until'] = moment().startOf('day').add('days', 1);
            }
            else if (date == 'tomorrow') {
                dateParams['due.from'] = moment().startOf('day').add('days', 1);
                dateParams['due.until'] = moment().startOf('day').add('days', 2);
            }
            else if (date == 'weekend') {
                dateParams['due.from'] = moment().day(6).startOf('day');
                dateParams['due.until'] = moment().day(7).startOf('day').add('days', 1);
            }
            else if (typeof date == 'object' && moment.isMoment(date)) {
                dateParams['due.from'] = date;
                dateParams['due.until'] = date.clone().add('days', 1);
            }
            return dateParams;
        }

        mkDateOptions() {
            var choices = [];
            var today = moment().startOf('day');
            for (var i = 0; i < 6; i++) {
                choices.push(today.clone().add('days', i));
            }
            return choices;
        }

    }

    return new DateFilters()


}]);