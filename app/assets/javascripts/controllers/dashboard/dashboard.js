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
        ['$scope','$http', 'statuses', 'sectionsService', 'config', function($scope, $http, statuses, sectionsService, config) {

        // content and stub fetch
        var getContent = function(evt, params) {
            $http.get('/api/content', {params: buildContentParams()}).success(function(response){
                $scope.contentItems = response.content;
                $scope.stubs = response.stubs;
                $scope.contentByStatus = groupByStatus(response.content);
            });
        };
        $scope.$on('getContent', getContent);
        $scope.$on('changedFilters', getContent);
        $scope.$watch('selectedContentType', getContent);
        $scope.$watch('selectedSection', getContent);

        $scope.sections = sectionsService.getSections();

        $scope.filters = {};

        $scope.statuses = statuses;

        function buildContentParams() {
            var params = angular.copy($scope.filters);
            params.state = $scope.selectedState;
            params.section = $scope.selectedSection;
            params["content-type"] = $scope.selectedContentType;
            params.status = $scope.selectedStatus;
            return params;
        };

        function groupByStatus(data) {
            return _.groupBy(data, function(x){ return x.status; });
        }

        // content items stuff

        $scope.stateIsSelected = function(state) {
            return $scope.selectedState == state;
        };
        $scope.selectState = function(state) {
            $scope.selectedState = state;
            getContent();
        };

        $scope.statusIsSelected = function(status) {
            return $scope.selectedStatus == status;
        };

        $scope.selectStatus = function(status) {
            $scope.selectedStatus = status;
            getContent();
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
            });
        }

        $scope.updateAssignee = function(stubId, assignee) {
            updateStubField(stubId, "assignee", assignee);
        };

        $scope.updateNote = function(stubId, note) {
            if(note.length > config.maxNoteLength) return "Note too long";
            updateStubField(stubId, "note", note);
        };

        $scope.dueDateUpdated = function(newDate) {
            var pickedDate = moment(newDate);
            $http({
                method: 'PUT',
                url: '/api/stubs/' + $scope.selectedContent.stubId + '/dueDate',
                data: {data: pickedDate.toISOString()}
            }).success(function() {
                $scope.selectedContent.due = pickedDate;
            })
        };


        $scope.deleteContent = function(content) {
            if (window.confirm("Are you sure? \"" + content.workingTitle + "\" looks like a nice content item to me.")) {
                $http({
                    method: 'DELETE',
                    url: 'api/content/' + content.composerId
                }).success(function(){getContent();})
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
                }).success(getContent());
            }
        };

    }]);

    return dashboardControllers;
});
