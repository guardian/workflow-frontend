import angular from 'angular';
import moment from 'moment';

import './url-service'

angular.module('paramsService', ['urlService']).factory('paramsService', function(urlService){

    class ParamsService {

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

        get(key)  {
            if(key === 'flags') {
                return this.stringToArray(urlService.get(key))
            }
            if(key === 'selectedDate') {
                return this.stringToDate(urlService.get(key))
            }
            else {
                return urlService.get(key)
            }
        }


    }

    return new ParamsService();

});

