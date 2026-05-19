import { isObject } from "lodash";
import type { FeatureSwitchData } from "./feature-switches";
import {
  FeatureSwitches,
  featureSwitchKeys,
  readableNames,
  getDefaultFeatureSwitchValues,
} from "./feature-switches";

export class FeatureSwitchService {
  fetchInitialData: () => Promise<FeatureSwitchData | undefined>;
  featureSwitches: FeatureSwitches;
  readableNames: Record<string, string>;
  dataPromise: Promise<void> | undefined;

  constructor(fetchInitialData: () => Promise<FeatureSwitchData>) {
    this.fetchInitialData = fetchInitialData;
    const entries = Object.entries(getDefaultFeatureSwitchValues()).filter(
      (featureSwitch) => featureSwitchKeys.includes(featureSwitch[0]),
    );
    this.featureSwitches = new FeatureSwitches(
      getDefaultFeatureSwitchValues(),
      entries,
    );

    this.readableNames = readableNames;
  }

  updateLocalFeatureSwitchValues(featureSwitchResult: FeatureSwitchData) {
    const filteredIncomingFeatureSwitchResult = Object.keys(featureSwitchResult)
      .filter((key) => featureSwitchKeys.includes(key))
      .reduce<FeatureSwitchData>((filteredResult, key) => {
        filteredResult[key] = featureSwitchResult[key];
        return filteredResult;
      }, {});

    if (isObject(filteredIncomingFeatureSwitchResult)) {
      this.featureSwitches.update(filteredIncomingFeatureSwitchResult);
      // $scope.$apply()
    } else {
      // It is useful to discard invalid values in the feature switch record
      console.error(
        `Feature switch values were unexpectedly not an object. Resetting feature switches.`,
      );
      this.featureSwitches.update(getDefaultFeatureSwitchValues());
    }
  }

  init() {
    this.dataPromise = this.fetchInitialData()
      .then((featureSwitchPreferences) => {
        if (featureSwitchPreferences) {
          this.updateLocalFeatureSwitchValues(featureSwitchPreferences);
        }
      })
      .catch((err) => {
        // TO DO - report error
        console.error("failed to fetch feature switches", err);
      });

    return this.dataPromise;
  }

  getFeatureSwitchData() {
    const promise = this.dataPromise ?? this.init();
    return promise.then(() => this.featureSwitches.switches);
  }
}
