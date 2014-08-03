import angular from 'angular';
import moment from 'moment';

import './url-service';
import './format-service';
import './date-filters-service';

angular.module('filtersService', ['urlService', 'formatService', 'dateFilters'])
       .factory('filtersService', function(urlService, formatService, dateFilters){

        class FiltersService {

            constructor() {
                this.filters = {};
                this.filters['status'] = urlService.get('status');
                this.filters['state']  = urlService.get('state');
                this.filters['section']= urlService.get('section');
                this.filters['content-type']= urlService.get('content-type');
                this.filters['selectedDate'] = formatService.stringToDate(urlService.get('selectedDate'));
                this.filters['flags'] = formatService.stringToArray(urlService.get('flags'));
                this.filters['prodOffice'] = urlService.get('prodOffice');
            }

            toServerParams() {
                var params = {};
                params.status = this.filters['status'];
                params.state = this.filters['state'];
                params.section = this.filters['section'];
                params["content-type"] = this.filters["content-type"];
                params.flags = this.filters['flags'];

                var dateParams = dateFilters.setToAndFrom(this.filters['selectedDate']);

                params['due.from'] = formatService.dateForUri(dateParams['due.from']);
                params['due.until'] = formatService.dateForUri(dateParams['due.until']);
                return params;

            }

            update(key, value) {
                this.filters[key] = value;
                urlService.set(key,formatService.objToStr(value));
            }

            get(key) {
                return this.filters[key];
            }

        }

        return new FiltersService();

    });