export const uiEditRights = (wfComposerService) => ({
  scope: {
    contentItem: '=contentItem'
  },
  template: `
    <label class="rights-field__input-label">
      <input type="checkbox"
             class="rights-field__input"
             ng-model="contentItem.item.rightsSyndicationAggregate"
             ng-click="$event.stopPropagation()"
             ng-change="updateRights()"
      />
      <span>Syndicatable</span>
    </label>
    <label class="rights-field__input-label">
      <input type="checkbox"
             class="rights-field__input"
             ng-model="contentItem.item.rightsSubscriptionDatabases"
             ng-click="$event.stopPropagation()"
             ng-change="updateRights()" />
      <span>Subscription databases</span>
    </label>
    <label class="rights-field__input-label">
      <input type="checkbox"
             class="rights-field__input"
             ng-model="contentItem.item.rightsDeveloperCommunity"
             ng-click="$event.stopPropagation()"
             ng-change="updateRights()" />
      <span>Developer community</span>
    </label>
  `,
  restrict: 'E',
  link(scope) {
    scope.updateRights = () => {
      wfComposerService.updateRights(scope.contentItem.composerId, {
        syndicationAggregate: scope.contentItem.item.rightsSyndicationAggregate,
        subscriptionDatabases: scope.contentItem.item.rightsSubscriptionDatabases,
        developerCommunity: scope.contentItem.item.rightsDeveloperCommunity
      })
    }
  }
})
