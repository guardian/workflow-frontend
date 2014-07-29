import angular from 'angular';

angular.module('serverParams', ['urlService']).factory('serverParams', function(urlService){

    class ServerParams {

        calculateSelectedDate(dueFromParam, dueFromUntil) {
            var dueFrom = moment(new Date(dueFromParam));
            var dueUntil = moment(new Date(dueFromUntil));

            if(dueFrom.isSame(moment().startOf('day')) &&
               dueUntil.isSame(moment().startOf('day').add('days', 1))) {
                return 'today';
            }

            else if(dueFrom.isSame(moment().startOf('day').add('days', 1))
                && dueUntil.isSame(moment().startOf('day').add('days', 2))) {
                return 'tomorrow';
            }

            else if(dueFrom.isSame(moment().day(6).startOf('day'))
                && dueUntil.isSame(moment().day(7).startOf('day').add('days', 1))) {
                return 'weekend';
            }

            else if(dueFrom.isValid() && dueFromParam!==null && typeof dueFromParam !=='undefined') {
                return dueFrom.format("DD-MM-YYYY")
            }
        };

        updateParams(params) {
           for(var property in params) {
               if(!(property === 'due.from' || property === 'due.until')) {
                   urlService.set(property, params[property]);
               }
               if(property==='flags' && params[property].length > 0) {
                   urlService.set(property, params[property].toString())
               }
           }

           var selectedDate = this.calculateSelectedDate(params['due.from'], params['due.until']);
           urlService.set('selectedDate', selectedDate);
        }
    }

    return new ServerParams();

});