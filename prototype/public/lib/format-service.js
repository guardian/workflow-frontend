import angular from 'angular';

angular.module('formatService',[]).factory('formatService', [function(){

    class FormatService {
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
            else if(value==='today' || value==='tomorrow' || value==='weekend') {
                return value;
            }
        }

        dateToString(value) {
            if(typeof value == 'object') {
                return moment(value).format("DD-MM-YYYY");
            }
            else return value;
        }

        objToStr(value) {
            if(typeof value == 'object' && moment.isMoment(value)) {
                return moment(value).format("DD-MM-YYYY");
            }
            else return value;
        }

        dateForUri(date) {
            if(moment.isMoment(date)) {
                return moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
            }
            else return date;
        }

    }

    return new FormatService();

}]);