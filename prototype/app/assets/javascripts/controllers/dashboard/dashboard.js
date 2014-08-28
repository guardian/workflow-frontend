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
        ['$scope','$http', 'urlParser', 'statuses', 'sections','legalStatesService', 'config', 'prodOfficeService', 'wfContentService', 'wfContentPollingService',

        function($scope, $http, urlParser, statuses, sections, legalStatesService, config, prodOfficeService, wfContentService, wfContentPollingService) {

         //initialise the model from the url
         var initialParams = urlParser.parseUrl;
         $scope.filters = {};
         $scope.selectedStatus = initialParams['status'];
         $scope.selectedState = initialParams['state'];
         $scope.selectedSection = initialParams['section'];
         $scope.selectedProdOffice = initialParams['prodOffice'];
         $scope.selectedContentType = initialParams['content-type'];
         $scope.flags = initialParams['flagsModel'] || [];

        var getContent = function(evt, params) {
            var params = buildContentParams();
            wfContentService.get(params).success(function(response){
                updateScopeModels(response);
                urlParser.setUrl(params);
            });
        };

        $scope.$on('getContent', getContent);
        $scope.$on('changedFilters', getContent);
        $scope.$watch('selectedContentType', getContent);
        $scope.$watch('selectedSection', getContent);
        $scope.$watch('selectedProdOffice', getContent);

        $scope.sections = sections;
        $scope.legalStates = legalStatesService.getLegalStates();

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.statuses = statuses;


        // Update models in the scope when data is retrieved
        function updateScopeModels(data) {
          $scope.stubs = data.stubs;
          $scope.contentByStatus = groupByStatus(data.content);

          if ($scope.selectedContent) {
            var found = _.findWhere(data.content, { composerId: $scope.selectedContent.composerId });

            // found will be undefined when not found -> when something is deleted.
            $scope.selectedContent = found;
          }
        }

        // Poll for updates
        var poller = new wfContentPollingService(buildContentParams);

        poller.onPoll(updateScopeModels);

        poller.startPolling();

        $scope.$on('destroy', function() {
          poller.stopPolling();
        });

        // end polling logic


        $scope.$on('getContent.failed', function(event, msg) {
          $scope.getContentError = msg.error;
        });

        function groupByStatus(data) {
           return _.groupBy(data, function(x){ return x.status; });
        }


        function buildContentParams() {
            var params = angular.copy($scope.filters);
            params.state = $scope.selectedState;
            params.section = $scope.selectedSection;
            params["content-type"] = $scope.selectedContentType;
            params.status = $scope.selectedStatus;
            params.flags = $scope.flags;
            params.prodOffice = $scope.selectedProdOffice;
            return params;
        };

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

        $scope.flagActive = function(flag) {
            return $scope.flags.indexOf(flag) != -1;
        };

        $scope.toggleFlag = function(flag) {
            if($scope.flags.indexOf(flag) == -1) {
                $scope.flags.push(flag);
            } else {
                $scope.flags = $scope.flags.filter( function(e) { return e !== flag });
            }
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
