import angular from 'angular';

angular.module('formatService',[]).factory('formatService', [function(){

    class FormatService {
        stringToArray(value) {
            if(value) {
                return value.split(",");
            }
            else return [];
        }

        arrayToString(value) {
            if(value.length > 0){
                return value.toString
            }
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
    }

    return new FormatService();

}]);