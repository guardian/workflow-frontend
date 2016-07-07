/**
 * 
 */

console.log("Hello to the admin")

var SectionToTagApp = angular.module('SectionToTag', []);
SectionToTagApp.controller('tagsPickerAppCtrl', function($scope,$http) {
    $scope.tag_search_results = []
    $scope.newSearchFragment = function(){
        $http({
            method : "GET",
            url : "https://content.guardianapis.com/tags?api-key="+CONFIG.CAPI_API_KEY+"&q="+encodeURIComponent($scope.searchfragment)
        }).then(function mySuccess(response) {
            $scope.tag_search_results = [];
            angular.forEach(response.data.response.results, function(item, key) {
                this.push(item.id);
            }, $scope.tag_search_results);
        }, function myError(response) {
            console.log(response.statusText)
        });
    }
    $scope.addSectionTagPairing = function(sectionId,tag){
        $http({
            method : "POST",
            url : "/admin/sectiontag",
            data: {
                "section_id": sectionId,
                "tag_id"    : tag
            }
        }).then(function mySuccess(response) {
            setTimeout(function(){
                location.reload();
            },1000);
        }, function myError(response) {
            console.log(response.statusText)
        });
    }
    $scope.removeSectionTagPairing = function(sectionId,tag){
        $http({
            method : "POST",
            url : "/admin/sectiontag/delete",
            data: {
                "section_id": sectionId,
                "tag_id"    : tag
            }
        }).then(function mySuccess(response) {
            setTimeout(function(){
                location.reload();
            },1000);
        }, function myError(response) {
            console.log(response.statusText)
        });
    }
});
