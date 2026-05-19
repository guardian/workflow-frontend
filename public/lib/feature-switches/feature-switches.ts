export type FeatureSwitchData = Record<string, boolean>;
export type FeatureSwitchEntries = Array<[string, boolean]>;

export const featureSwitchKeys = [
  // e.g. 'multiByline'
  "intendedAudienceColumn",
];

export const readableNames = {
  // e.g. 'multiByline': 'Multi-byline',
  intendedAudienceColumn: "Show Intended Audience",
};

export const getDefaultFeatureSwitchValues = (): FeatureSwitchData => {
  const switches: FeatureSwitchData = {};
  featureSwitchKeys.forEach((key) => (switches[key] = false));
  return switches;
};

export class FeatureSwitches {
  switches: FeatureSwitchData;
  entries: FeatureSwitchEntries;

  constructor(switches: FeatureSwitchData, entries: FeatureSwitchEntries) {
    // this.switches should be a single object with the type { [key]: value }
    this.switches = switches;
    this.entries = entries;
  }

  update(incomingSwitches: FeatureSwitchData) {
    // Update the switches with a partial set
    this.switches = { ...this.switches, ...incomingSwitches };
    this.entries.length = 0;
    Object.entries(this.switches).forEach((featureSwitch) => {
      this.entries.push(featureSwitch);
    });
  }
}
