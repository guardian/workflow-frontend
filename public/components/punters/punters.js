/**
 * Created by cfinch on 09/01/2015.
 */
function punters ($rootScope, wfGoogleApiService) {

    /**
     * Filter one array based on another
     * @param list Array to be filtered
     * @param shouldNotContain Items the array should not contain
     * @returns {*}
     */
    function filterList(list, shouldNotContain) {

        if (list && list.filter) {
            return list.filter((item) => {
                return shouldNotContain.indexOf(item) === -1;
            });
        } else {
            return list;
        }
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/assets/components/punters/punters.html',
        scope: {
            stub: '=',
            indrawer: '='
        },
        link: function ($scope, $elem) {

            var field = $elem[0].querySelector('.punters__autocomplete-field'),
                list = $elem[0].querySelector('.punters__autocomplete-list'),
                input = $elem[0].querySelector('.punters__text-input'),
                selectedTokenIndex = 0;

            $scope.tokens = [];

            /**
             * Emulate focus and blur styles from inputs on div container for autocomplete
             */
            (function emulateInputFocusBehaviour () {
                input.addEventListener('focus', () => {
                    field.classList.add('punters__autocomplete-field--focus');
                });
                input.addEventListener('blur', () => {
                    field.classList.remove('punters__autocomplete-field--focus');
                });
            })();

            /**
             * Manage the selected state of the items according to the selected item index
             * @param newIndex the index to update the selected item to.
             */
            function updateSelectedItem (newIndex) {

                if ($scope.foundUsers && $scope.foundUsers.length > 0) {

                    if ($scope.foundUsers[selectedTokenIndex] && $scope.foundUsers[selectedTokenIndex].selected) {
                        delete $scope.foundUsers[selectedTokenIndex].selected;
                    }
                    selectedTokenIndex = newIndex;
                    $scope.foundUsers[selectedTokenIndex].selected = true;

                    keepInView();
                }
            }

            /**
             * Ensure the the list scrolls to keep the currently selected list item in view
             */
            function keepInView () {

                var selectedEl = list.children[selectedTokenIndex];

                if (selectedEl) {

                    var height = selectedEl.offsetHeight,
                        elOffset = height * (selectedTokenIndex + 1),
                        viewBoundTop = list.scrollTop,
                        viewBoundBot = viewBoundTop + list.offsetHeight;

                    if (elOffset > viewBoundBot) { // Bring in to view
                        list.scrollTop += height;
                    } else if (elOffset <= viewBoundTop) { // Bring in to view
                        list.scrollTop -= height;
                    }
                }
            }

            /**
             * Reset the autocomplete list for when it should be emptied
             */
            function resetAutocomplete () {
                $scope.foundUsers = []; // Reset search
                selectedTokenIndex = 0; // reset selected token
            }

            $scope.addToken = function (user) {

                if ($scope.tokens.length === 0) { // artificial limit to 1 token for time being

                    $scope.tokens.push(user);
                    $scope.foundUsers = filterList($scope.foundUsers, $scope.tokens);

                    // Update model

                    $scope.stub.assigneeEmail = user.primaryEmail;
                    $scope.stub.assignee = user.name.fullName;

                    /*
                    Uncomment here for multiple users...
                    ---------------------------------------------------------------------------

                    // Email address
                    if (!!$scope.stub.assigneeEmail && $scope.stub.assigneeEmail.length > 0) {
                        $scope.stub.assigneeEmail = $scope.stub.assigneeEmail.split(',');
                    } else {
                        $scope.stub.assigneeEmail = [];
                    }

                    $scope.stub.assigneeEmail.push(user.primaryEmail);
                    $scope.stub.assigneeEmail = $scope.stub.assigneeEmail.join(',');

                    // Name
                    if (!!$scope.stub.assignee && $scope.stub.assignee.length > 0) {
                        $scope.stub.assignee = $scope.stub.assignee.split(',');
                    } else {
                        $scope.stub.assignee = [];
                    }

                    $scope.stub.assignee.push(user.name.fullName);
                    $scope.stub.assignee = $scope.stub.assignee.join(',');
                     ---------------------------------------------------------------------------
                     */

                    input.value = ""; // clear input when token is added
                    resetAutocomplete();

                    $rootScope.$emit('punters.punterSelected');
                }
            };

            $scope.removeToken = function ($index) {
                $scope.tokens.splice($index, 1);

                // Update model
                $scope.stub.assigneeEmail = $scope.stub.assigneeEmail.split(',').splice($index,1).join(',');
                $scope.stub.assignee = $scope.stub.assignee.split(',').splice($index,1).join(',');
            };

            /**
             * Listen to key events on the input for searching, navigating, selecting and deleting items
             * @param $event keyDown event from Angular
             */
            $scope.keyDown = function ($event) {

                switch ($event.keyCode) {
                    case 40: // Down
                        $event.preventDefault();
                        var nextToken = selectedTokenIndex + 1 <= $scope.foundUsers.length - 1 ? selectedTokenIndex + 1 : $scope.foundUsers.length - 1;
                        updateSelectedItem(nextToken);
                        break;

                    case 38: // Up
                        $event.preventDefault();
                        var nextToken = selectedTokenIndex - 1 >= 0 ? selectedTokenIndex - 1 : 0;
                        updateSelectedItem(nextToken);
                        break;

                    case 13: // Enter
                        $event.preventDefault();
                        $scope.addToken($scope.foundUsers[selectedTokenIndex]);
                        updateSelectedItem(selectedTokenIndex + 1);
                        break;

                    case 8: // Backspace
                        if (input.value.length === 0) { // no text to delete so delete tokens..
                            if ($scope.tokens.length > 0) {
                                $scope.tokens.pop();
                            }
                            resetAutocomplete();
                        } else if (input.value.length === 1) { // remove the list
                            resetAutocomplete();
                        } else {
                            searchForUsers();
                        }
                        break;

                    default:
                        searchForUsers();
                }

                function searchForUsers () {
                    if (input.value && input.value.length > 0) {
                        wfGoogleApiService.searchUsers(input.value).then((data) => {
                            if (data && data.length > 0) {
                                $scope.foundUsers = filterList(data, $scope.tokens);
                                if (selectedTokenIndex > $scope.foundUsers.length -1) {
                                    selectedTokenIndex = 0;
                                }
                                updateSelectedItem(selectedTokenIndex);
                            }
                        });
                    } else {
                        resetAutocomplete();
                    }
                }
            };

            $scope.assignToMe = function () {

                input.focus();

                input.value = "";
                resetAutocomplete();

                wfGoogleApiService.searchUsers(_wfConfig.user.email).then((data) => { // dirty...
                    if (data && data.length > 0) {
                        $scope.addToken(data[0]);
                    }
                });
            };
        }
    };
}

export { punters }
