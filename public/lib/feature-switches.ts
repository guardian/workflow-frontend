type FeatureSwitchData = Record<string, unknown>;

type FeatureSwitch = {
  key: string;
  defaultValue: boolean;
  description: string;
};

const featureSwitchList: FeatureSwitch[] = [];

export const featureSwitchKeys = featureSwitchList.map(
  (featureSwitch) => featureSwitch.key,
);

export const getDefaultFeatureSwitchValues = (): FeatureSwitchData => {
  const switches: FeatureSwitchData = {};
  featureSwitchList.forEach(
    ({ key, defaultValue }) => (switches[key] = defaultValue),
  );
  return switches;
};

export const featureSwitchReadableNames = featureSwitchList.reduce<
  Record<string, string>
>((namesMap, nextSwitch) => {
  return { ...namesMap, [nextSwitch.key]: nextSwitch.description };
}, {});
