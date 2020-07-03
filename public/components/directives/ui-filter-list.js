import angular from 'angular';
import _ from 'lodash';
import getKeyCodes from 'keycode'
 
//Taken straight out of composer. 

export function uiFilterList($q, $window) {
      var win = angular.element($window);
      return {
          restrict: 'A',
          priority: 1,
          link: function(scope, element, attrs) {
              var collectionName = attrs.uiFilterList;

              function clearResults() {
                  $q.when(scope[collectionName] || []).then(function (collection) {
                      collection.length = 0;
                  });

                  scope.$apply();
              }

              // Select the first item when the list changes
              scope.$watch(collectionName, function (collection) {
                  if (collection && collection.length > 0) {
                      collection[0].selected = true;
                  }
              });

              /**
               * Reset the list when clicking out of the input
               */

              // Note: we used to observe the blur event on the
              // element, but that is triggered on mousedown, so if
              // you click slowly, the field is blurred before you
              // mouseup on your selection.  As a workaround, wait
              // until after mouseup to clear the list.

              // A nicer solution would be:
              //   http://stackoverflow.com/a/12627314/1082754
              // but that requires changing this directive to own
              // the list DOM as well.

              function mouseUpListener() {
                  // Blurring when the list is not empty
                  var isFocused = element[0] === document.activeElement;
                  if (! isFocused && scope[collectionName]) {
                      // Extra superstition/safety to let click
                      // handlers capture events on the list first.
                      setTimeout(function () {
                          clearResults();
                      }, 100);
                  }
              }

              var mouseUpBound = false;
              scope.$watch(collectionName, function (collection) {
                  var empty = ! collection || collection.length === 0;
                  if (empty && mouseUpBound) {
                      win.unbind('mouseup', mouseUpListener);
                      mouseUpBound = false;
                  } else if (! empty && ! mouseUpBound) {
                      win.bind('mouseup', mouseUpListener);
                      mouseUpBound = true;
                  }
              });

              element.bind('input', function (_event) {
                  if (attrs.uiFilterListOnFilter) {
                      scope.$apply(attrs.uiFilterListOnFilter);
                  }
              });

              element.bind('keydown', function (event) {
                  if (event.keyCode === getKeyCodes('enter')) {
                      event.preventDefault();

                      // Allows for accepting a value as a promise or just a primitive
                      // TODO: if we used an isolate scope, this would be resolved for us… but then
                      // our templates would be bloated with references to `$parent`
                      $q.when(scope[collectionName] || []).then(function (collection) {
                          var selected = _.find(collection, function (model) {
                              return model.selected;
                          });

                          if (selected) {
                              scope.selectedItem = selected.item;
                              scope.$eval(attrs.uiFilterListOnSelect);
                          }
                      });
                  }

                  // Browse the list with up/down keys
                  // Allows for accepting a value as a promise or just a primitive
                  // TODO: if we used an isolate scope, this would be resolved for us… but then
                  // our templates would be bloated with references to `$parent`
                  $q.when(scope[collectionName] || []).then(function (collection) {
                      // Map key codes to an offset which will determine what item
                      // is selected next in the collection
                      var map = {};
                      map[getKeyCodes('up')] = -1;
                      map[getKeyCodes('down')] = 1;
                      var offset = map[event.keyCode];

                      if (!offset) { return; }

                      // If the up or down keys were pressed, only then can we
                      // prevent default (the input by default moves the caret).
                      // This is done before verifying the collection to ensure
                      // a consistent user experience.
                      event.preventDefault();

                      var selected = _.find(collection, function (model) {
                          return model.selected;
                      });
                      // Deslect the currently selected item
                      if (selected) {
                          selected.selected = false;
                      }

                      var selectedIndex = collection.indexOf(selected);
                      // Ensure a default index if there is not one
                      if (selectedIndex === -1) {
                          selectedIndex = 0;
                      }

                      // Find the item to select, and select it
                      var length = collection.length;
                      var futureIndex = ((selectedIndex + offset) + length) % length;
                      var futureItem = collection[futureIndex];
                      if (futureItem) {
                          futureItem.selected = true;
                      }
                  });

                  scope.$apply();
              });

              // Escape key
              element.bind('keydown', function (event) {
                  if (event.keyCode === getKeyCodes('escape')) {
                      clearResults();
                  }
              });

          }
      };
  } 