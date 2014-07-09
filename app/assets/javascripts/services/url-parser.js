define(['angular', 'moment'], function(angular, moment) {
    'use strict';

     var urlParser = angular.module('urlParser', []);

    urlParser.factory('urlParser', ['$location', function($location){
        function parseUrl() {
            var params = $location.search();
            selectedDateModel(params);
            return params;
        };

        function setUrl(serverParams){
            var currentParams = $location.search();
            var updatedParams = serverToClientParms(serverParams);
            if(!angular.equals(currentParams, updatedParams)) {
                $location.search(updatedParams);
            }
        };

        function serverToClientParms(serverParams)  {
            var params = {};
            var selectedDate = calculateSelectedDate(serverParams['due.from'], serverParams['due.until']);

            //only update if the value is defined
            if(selectedDate) {
                params['selectedDate'] = selectedDate;
            }

            if(serverParams['state']) {
                params['state'] = serverParams['state'];
            }

            if(serverParams['status']) {
                params['status'] = serverParams['status'];
            }

            if(serverParams['section']) {
                params['section'] = serverParams['section'];
            }

            if(serverParams['content-type']) {
                params['content-type'] = serverParams['content-type'];
            }

            return params;
        }

        function selectedDateModel(params) {
            var selectedDate = params['selectedDate'];
            if(selectedDate === 'today') {
                params['selectedDateModel'] = 'today';
            }
            else if(selectedDate === 'tomorrow') {
                params['selectedDateModel'] = 'tomorrow';
            }
            else if(selectedDate === 'weekend') {
                params['selectedDateModel'] = 'weekend';
            }
            else if (moment(selectedDate, ["DD-MM-YYYY"]).isValid()){
                var day = moment(selectedDate, ["DD-MM-YYYY"]);
                params['selectedDateModel'] = day;
            }
        };

        function calculateSelectedDate(dueFromParam, dueFromUntil) {
            var dueFrom = moment(new Date(dueFromParam));
            var dueUntil = moment(new Date(dueFromUntil));

            if(dueFrom.isSame(moment().startOf('day')) && dueUntil.isSame(moment().startOf('day').add('days', 1))) {
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
        return {
            parseUrl: parseUrl(),
            setUrl: setUrl
        };
    }]);

    return urlParser;
});
