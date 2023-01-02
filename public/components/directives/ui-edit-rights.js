export const uiEditRights = (wfComposerService) => ({
  scope: {
    contentItem: '=contentItem',
    inline: '@inline'
  },
  template: `
    <div class="ui-edit-rights">
      <div ng-if="inline">
          <span ng-if="hasRightsData()">
              Reviewed
          </span>
          <span ng-if="!hasRightsData()">
              <button class="btn btn-xs btn-info margin-right-small" ng-click="setAllRights(true); $event.stopPropagation()">
                  Add all
              </button>
              <button class="btn btn-xs btn-info" ng-click="setAllRights(false); $event.stopPropagation()">
                  Remove all
              </button>
          </span>
      </div>
      <div ng-if="!inline">
        <div>
          <label class="ui-edit-rights__label" for="rights-syndication-aggregate">
            <input type="checkbox"
                   id="rights-syndication-aggregate"
                   class="ui-edit-rights__input"
                   ng-model="contentItem.item.rightsSyndicationAggregate"
                   ng-click="$event.stopPropagation()"
                   ng-change="updateRights()"
            />
            <span>Syndicatable</span>
          </label>
        </div>
        <div>
          <label class="ui-edit-rights__label" for="rights-subscription-databases">
            <input type="checkbox"
                   id="rights-subscription-databases"
                   class="ui-edit-rights__input"
                   ng-model="contentItem.item.rightsSubscriptionDatabases"
                   ng-click="$event.stopPropagation()"
                   ng-change="updateRights()" />
            <span>Subscription databases</span>
          </label>
        </div>
        <div>
          <label class="ui-edit-rights__label" for="rights-developer-community">
            <input type="checkbox"
                   id="rights-developer-community"
                   class="ui-edit-rights__input"
                   ng-model="contentItem.item.rightsDeveloperCommunity"
                   ng-click="$event.stopPropagation()"
                   ng-change="updateRights()" />
            <span>Developer community</span>
          </label>
        </div>
      </div>
    </div>
  `,
  restrict: 'E',
  link(scope) {
    scope.showAllOptions = false;

    scope.toggleShowAllOptions = () => scope.showAllOptions = !scope.showAllOptions;

    scope.hasRightsData = () =>
        scope.contentItem.item.rightsSyndicationAggregate !== null &&
        scope.contentItem.item.rightsSubscriptionDatabases !== null &&
        scope.contentItem.item.rightsDeveloperCommunity !== null;

    scope.updateRights = () => {
      wfComposerService.updateRights(scope.contentItem.composerId, {
        syndicationAggregate: scope.contentItem.item.rightsSyndicationAggregate,
        subscriptionDatabases: scope.contentItem.item.rightsSubscriptionDatabases,
        developerCommunity: scope.contentItem.item.rightsDeveloperCommunity
      })
    };

    scope.setAllRights = (hasRights) => {
      scope.contentItem.item.rightsSyndicationAggregate = hasRights;
      scope.contentItem.item.rightsSubscriptionDatabases = hasRights;
      scope.contentItem.item.rightsDeveloperCommunity = hasRights;
      scope.updateRights();
    }
  }
})
