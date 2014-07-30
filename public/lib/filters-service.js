import angular from 'angular';
import moment from 'moment';

angular.module('filtersService', ['urlService'])
       .factory('filtersService', function(urlService){

        //var possibleFilters = ['status','state','section','due.from','due.until','selectedDate','content-type','flags']

        class FiltersService {

            stringToArray(value) {
                if(value) {
                    return value.split(",");
                }
                else return [];
            }

            stringToDate(value) {
                if (moment(value, ["DD-MM-YYYY"]).isValid()){
                    return moment(value, ["DD-MM-YYYY"]);
                }
                else return value;
            }

            dateToString(value) {
                if(typeof value == 'object') {
                    return moment(value).format("DD-MM-YYYY");
                }
                else return value;
            }



            constructor() {
                this.filters = {};
                this.filters['status'] = urlService.get('status');
                this.filters['state']  = urlService.get('state');
                this.filters['section']= urlService.get('section');
                this.filters['content-type']= urlService.get('content-type');
                var date = urlService.get('selectedDate');
                var dateToEndpoint = this.dateToEndpoints(date);
                this.filters['selectedDate'] = this.stringToDate(urlService.get('selectedDate'));
                this.filters['flags'] = this.stringToArray(urlService.get('flags'));
                this.filters['due.from'] = dateToEndpoint['dueFrom'];
                this.filters['due.until'] = dateToEndpoint['dueUntil'];
            }


            getParams() {
                return this.filters;
            }

            update(key, value) {
                this.filters[key] = value;
                urlService.set(key,value);
            }

            updateDate(date) {
                this.filters['selectedDate'] = this.dateToString(date);
                var dateToEndpoint = this.dateToEndpoints(date);
                this.filters['due.from'] = dateToEndpoint['dueFrom'];
                this.filters['due.until'] = dateToEndpoint['dueUntil'];
                urlService.set('selectedDate',this.dateToString(date));
            }

            formatDateForUri(date) {
                return moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
            }

            mkDateOptions() {
                var choices = [];
                var today = moment().startOf('day');
                for (var i = 0; i < 6; i++) {
                    choices.push(today.clone().add('days', i));
                }
                return choices;
            }

            dateToEndpoints(date) {

                var data = {};

                if (date == 'today') {
                    data['dueFrom'] = moment().startOf('day');
                    data['dueUntil'] = moment().startOf('day').add('days', 1);

                }
                else if (date == 'tomorrow') {
                    data['dueFrom'] = moment().startOf('day').add('days', 1);
                    data['dueUntil'] = moment().startOf('day').add('days', 2);
                }
                else if (date == 'weekend') {
                    data['dueFrom'] = moment().day(6).startOf('day');
                    data['dueUntil'] = moment().day(7).startOf('day').add('days', 1);
                }
                else if (typeof date == 'object') {
                    data['dueFrom'] = date && this.formatDateForUri(date);
                    data['dueUntil'] = date.clone().add('days', 1) && this.formatDateForUri(date);
                }

                return data;
            }

            endpointsToDate(dueFromParam, dueUntilParam) {
                var dueFrom = moment(new Date(dueFromParam));
                var dueUntil = moment(new Date(dueUntilParam));

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
            }

            get(key) {
                return this.filters[key];
            }

        }

        return new FiltersService

    });