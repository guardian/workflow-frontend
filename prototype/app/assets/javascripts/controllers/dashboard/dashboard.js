define([
    'angular',
    'moment',
    'underscore',
    '../dashboard'
], function (
    angular,
    moment,
    _,
    dashboardControllers
) {
    'use strict';

    dashboardControllers.controller('DashboardCtrl',
        ['$scope','$http', 'statuses', 'sections','legalStatesService', 'config', 'filtersService','prodOfficeService',
         function($scope, $http, statuses, sections, legalStatesService, config, filtersService, prodOfficeService) {

         $scope.selectedStatus = filtersService.get('status');
         $scope.selectedState = filtersService.get('state');
         $scope.selectedSection = filtersService.get('section');
         $scope.selectedContentType = filtersService.get('content-type');
         $scope.flags = filtersService.get('flags');
         $scope.selectedProdOffice = filtersService.get('prodOffice');

        var getContent = function(evt, params) {
            var params = filtersService.toServerParams();
            $http.get('/api/content', {params: params}).success(function(response){
                $scope.contentItems = response.content;
                $scope.stubs = response.stubs;
                $scope.contentByStatus = groupByStatus(response.content);
            });
        };

        $scope.$on('getContent', getContent);
        $scope.$on('changedFilters', getContent);

        $scope.$watch('selectedProdOffice', function(){
            $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice)
        });
        $scope.$watch('selectedContentType', function(){
            $scope.$emit('filtersChanged.content-type', $scope.selectedContentType);
        });
        $scope.$watch('selectedSection', function(){
            $scope.$emit('filtersChanged.section', $scope.selectedSection);
        });

        $scope.sections = sections;
        $scope.legalStates = legalStatesService.getLegalStates();

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.statuses = statuses;

        function groupByStatus(data) {
            return _.groupBy(data, function(x){ return x.status; });
        }

        // content items stuff

        $scope.stateIsSelected = function(state) {
            return $scope.selectedState == state;
        };
        $scope.selectState = function(state) {
            $scope.selectedState = state;
            $scope.$emit('filtersChanged.state', $scope.selectedState);
        };

        $scope.statusIsSelected = function(status) {
            return $scope.selectedStatus == status;
        };

        $scope.selectStatus = function(status) {
            $scope.selectedStatus = status;
            $scope.$emit('filtersChanged.status', $scope.selectedStatus);
        };

        $scope.flagActive = function(flag) {
            return $scope.flags.indexOf(flag) != -1;
        };

        $scope.toggleFlag = function(flag) {
            if($scope.flags.indexOf(flag) == -1) {
                $scope.flags.push(flag);
            } else {
                $scope.flags = $scope.flags.filter( function(e) { return e !== flag });
            }
            $scope.$emit('filtersChanged.flags', $scope.flags);
        };

        $scope.contentTypeIsSelected = function (contentType) {
            return $scope.selectedContentType == contentType;
        };

        $scope.showDetail = function(content) {
            $scope.selectedContent = content;
        };

        function updateStubField(stubId, field, data) {
            $http({
                method: 'PUT',
                url: '/api/stubs/' + stubId + '/' + field,
                data: {data: data}
            }).success(function() {
                $scope.$emit('content.edited', { 'content': $scope.selectedContent, 'field': field });
            });
        }

        $scope.updateAssignee = function(stubId, assignee) {
            updateStubField(stubId, "assignee", assignee);
        };

        $scope.updateNote = function(stubId, note) {
            if(note.length > config.maxNoteLength) return "Note too long";
            updateStubField(stubId, "note", note);
        };

        $scope.updateProdOffice = function(stubId, prodOffice) {
            updateStubField(stubId, "prodOffice", prodOffice);
        };

        $scope.dueDateUpdated = function() {

            var content = $scope.selectedContent,
                parsedDate,
                requestData;

            if (content.due) {
                parsedDate = moment(content.due);
                if (parsedDate.isValid()) {
                    requestData = { data: parsedDate.toISOString() };
                }
            }

            $http({
                method: 'PUT',
                url: '/api/stubs/' + content.stubId + '/dueDate',
                data: requestData || {}
            }).success(function() {
                $scope.$emit('content.edited', { 'content': content, 'field': 'dueDate' });
            });
        };

        $scope.updateNeedsLegal = function() {
	    updateStubField($scope.selectedContent.stubId, 'needsLegal', $scope.selectedContent.needsLegal)
        };

        $scope.deleteContent = function(content) {
            if (window.confirm("Are you sure? \"" + content.workingTitle + "\" looks like a nice content item to me.")) {
                $http({
                    method: 'DELETE',
                    url: 'api/content/' + content.composerId
                }).success(function(){
                  $scope.$emit('content.deleted', { 'content': content });
                  getContent();
                });
            };
        }

        // stubs stuff

        $scope.$on('newStubButtonClicked', function (event, contentType) {
            $scope.$broadcast('newStub', contentType);
        });

        $scope.$on('importFromComposerButtonClicked', function (event) {
            $scope.$broadcast('composerImport');
        });

        $scope.editStub = function (stub) {
            $scope.$broadcast('editStub', angular.copy(stub));
        };

        $scope.addToComposer = function(stub, composerUrl) {
            $scope.$broadcast('addToComposer', stub, composerUrl)
        };

        $scope.deleteStub = function(stub) {
            if (window.confirm("Are you sure? \"" + stub.title + "\" looks like a nice stub to me.")) {
                $http({
                    method: 'DELETE',
                    url: '/api/stubs/' + stub.id
                }).success(function() {
                  $scope.$emit('stub.deleted', { 'content': stub });
                  getContent();
                });
            }
        };

    }]);

    return dashboardControllers;
});
