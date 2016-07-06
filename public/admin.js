/**
 * 
 */

console.log("Hello to the admin")

var app1 = angular.module('SectionToTag', []);
app1.controller('tagsPickerAppCtrl', function($scope,$http) {
    $scope.tag_search_results = []
    $scope.newSearchFragment = function(){
        console.log( $scope.searchfragment )
        // https://content.guardianapis.com/tags?api-key=67ec2e48-12cb-456a-a2ae-d292603e1372&q=apple
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
    $scope.add_section_tag_pairing = function(sectionId,tag){
        console.log("Adding: ( "+sectionId+", "+tag+" )")
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
    $scope.remove_section_tag_pairing = function(sectionId,tag){
        console.log("Removing: ( "+sectionId+", "+tag+" )")
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
