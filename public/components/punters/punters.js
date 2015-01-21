/**
 * Created by cfinch on 09/01/2015.
 */
function punters (wfGoogleApiService, $http) {

    function searchUsers(value) {

        var url = 'https://www.googleapis.com/admin/directory/v1/users',
            searchParam = '?query=' + escape(value),
            otherParams = '&domain=guardian.co.uk&viewType=domain_public';

        var searchUrl = url + searchParam + otherParams;

        var req = {
            method: 'GET',
            url: searchUrl,
            headers: {
                'Authorization': 'Bearer ' + window.gapi.auth['access_token']
            }
        };

        return $http(req).then((response) => {
            return response.data.users;
        }, () => {
            console.error('Could not query Google API for users');
        });
    }

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
            stub: '='
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
                $scope.tokens.push(user);
                $scope.foundUsers = filterList($scope.foundUsers, $scope.tokens);

                // Update model
                if (!!$scope.stub.assignee && $scope.stub.assignee.length > 0) {
                    $scope.stub.assignee = $scope.stub.assignee.split(',');
                } else {
                    $scope.stub.assignee = [];
                }

                $scope.stub.assignee.push(user.primaryEmail);
                $scope.stub.assignee = $scope.stub.assignee.join(',');

                input.value = ""; // clear input when token is added
                resetAutocomplete();
            };

            $scope.removeToken = function ($index) {
                $scope.tokens.splice($index, 1);

                // Update model
                $scope.stub.assignee = $scope.stub.assignee.split(',').splice(-1,1).join(',');
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
                        searchUsers(input.value).then((data) => {
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

                searchUsers(_wfConfig.user.email).then((data) => { // dirty...
                    if (data && data.length > 0) {
                        $scope.addToken(data[0]);
                    }
                });
            };
        }
    };
}

export { punters }
