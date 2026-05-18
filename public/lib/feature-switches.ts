
type FeatureSwitchData = Record<string, unknown>;

export const featureSwitchKeys = [
  // e.g. 'multiByline'
  "intendedAudienceColumn",
];

export const getDefaultFeatureSwitchValues = ():FeatureSwitchData => {
  const switches:FeatureSwitchData = {};
  featureSwitchKeys.forEach((key) => (switches[key] = false));
  return switches;
};
