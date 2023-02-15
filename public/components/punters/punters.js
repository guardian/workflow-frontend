import puntersTemplate from './punters.html';

/**
 * Created by cfinch on 09/01/2015.
 */
function punters ($rootScope) {

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
        template: puntersTemplate,
        scope: {
            stub: '=',
            indrawer: '='
        },
        link: function ($scope, $elem) {

            var field = $elem[0].querySelector('.punters__autocomplete-field'),
                input = $elem[0].querySelector('.punters__text-input'),
                $input = angular.element(input);

            $scope.searchText = "";
            $scope.selectedIndex = 0;
            $scope.tokens = [];
            $scope.foundUsers = [];

            /**
             * Emulate focus and blur styles from inputs on div container for autocomplete
             */
            (function emulateInputFocusBehaviour () {
                $input.on('focus', () => {
                    field.classList.add('punters__autocomplete-field--focus');
                });
                $input.on('blur', () => {
                    field.classList.remove('punters__autocomplete-field--focus');
                });
            })();

            /**
             * Reset the autocomplete list for when it should be emptied
             */
            function resetAutocomplete () {
                $scope.foundUsers = []; // Reset search
                $scope.selectedIndex = 0; // reset selected token
            }

            $scope.addToken = function (userEmail, dontSendEvent) {

                if ($scope.tokens.length === 0) { // artificial limit to 1 token for time being

                    $scope.tokens.push(userEmail);
                    $scope.foundUsers = filterList($scope.foundUsers, $scope.tokens);

                    // Update model
                    $scope.stub.assigneeEmail = userEmail;
                    $scope.stub.assignee = userEmail?.substring(0,128); // TODO can we get rid of this field all together

                    $scope.searchText = ""; // clear input when token is added
                    resetAutocomplete();

                    if (!dontSendEvent) {
                        $rootScope.$emit('punters.punterSelected');
                    }
                }
            };

            // On load, pre-fill a token if someone already assigned
            if ($scope.stub.assigneeEmail) {
                $scope.addToken($scope.stub.assigneeEmail, true);
            }

            $scope.removeToken = function ($index, dontSendEvent) {
                $scope.tokens.splice($index, 1);

                // Update model
                $scope.stub.assigneeEmail = '';
                $scope.stub.assignee = '';

                if (!dontSendEvent) {
                    $rootScope.$emit('punters.punterSelected');
                }
            };

            /**
             * Listen to key events on the input for searching, navigating, selecting and deleting items
             * @param $event keyDown event from Angular
             */
            $scope.keyDown = function ($event) {

                switch ($event.keyCode) {
                    case 40: // Down
                        $event.preventDefault();
                        if($scope.selectedIndex < $scope.foundUsers.length) {
                            $scope.selectedIndex++;
                        }
                        break;

                    case 38: // Up
                        $event.preventDefault();
                        if($scope.selectedIndex > 0) {
                            $scope.selectedIndex--;
                        }
                        break;

                    case 13: // Enter
                        $event.preventDefault();
                        if ($scope.foundUsers.length && $scope.foundUsers[$scope.selectedIndex]) {
                            $scope.addToken($scope.foundUsers[$scope.selectedIndex]);
                        }
                        break;
                }
            };

            $scope.searchForUsers = function() {

                const searchText = $scope.searchText.trim();

                if (searchText && searchText.length > 0) {
                    fetch(`/api/people?prefix=${encodeURI(searchText)}`).then(_ => _.json()).then((data) => {
                        if (data && data.length > 0) {
                            $scope.foundUsers = data;
                            //FIXME figure out why it takes so long to render this new `foundUsers` list
                            if ($scope.selectedIndex > $scope.foundUsers.length - 1) {
                                $scope.selectedIndex = $scope.foundUsers.length - 1;
                            }
                        }
                    });
                } else {
                    // TODO check if we need to clear $scope.tokens
                    resetAutocomplete();
                }
            };

            $scope.assignToMe = function () {

                input.focus();

                $scope.searchText = "";
                resetAutocomplete();

                $scope.addToken(_wfConfig.user.email);
            };
        }
    };
}

export { punters }
