import { Stub } from "./stub";
import { LimitedTag } from "./tags";

type IntendedAudienceOptionValue =
  | "global"
  | "domestic-for-global"
  | "domestic-for-domestic"
  | "don-t-know"
  | null; 
  
  type AudienceTagSlug = "global" | "uk" | "au" | "us";
  const expectedAudienceSlugs = ["global", "uk", "au", "us"];
  
  export const offlineDefault = {
    displayName: "Not set",
    value: "don-t-know" as IntendedAudienceOptionValue,
  }
  
// If choosing an option is made mandatory, the intendedAudienceOptions should start with a default null option 
// so the user would have to explictly choose "Don't know" rather than it being the default.
export const intendedAudienceOptions: {
  displayName: string;
  value: IntendedAudienceOptionValue;
}[] = [
  offlineDefault,
  {
    displayName: "Global",
    value: "global",
  },
  {
    displayName: "Domestic for Global",
    value: "domestic-for-global",
  },
  {
    displayName: "Domestic for Domestic",
    value: "domestic-for-domestic",
  },
];

const tagMatchesSlug = (slug: string) => (tag: LimitedTag) =>
  tag.path?.split("/").pop() === slug;

const prodOfficeToAudienceTagSlug = (prodOffice: string): AudienceTagSlug => {
  switch (prodOffice.toLowerCase()) {
    case "uk":
      return "uk";
    case "us":
      return "us";
    case "au":
      return "au";
  }

  return "uk";
};

const getSlugsFromOptionValue = (
  optionValue: IntendedAudienceOptionValue,
  stub: Stub,
): AudienceTagSlug[] => {
  const { prodOffice = "UK" } = stub;

  switch (optionValue) {
    case "domestic-for-domestic":
      return [prodOfficeToAudienceTagSlug(prodOffice)];
    case "domestic-for-global":
      return [prodOfficeToAudienceTagSlug(prodOffice), "global"];
    case "global":
      return ["global"];
    case "don-t-know":
    default:
      return [];
  }
};

export const getIntendedAudienceFromOptionValue = (
  optionValue: IntendedAudienceOptionValue,
  stub: Stub,
): string => {
  return getSlugsFromOptionValue(optionValue, stub).join(",");
};

export const areAllExpectedTagsAvailable = (
  audienceTags: LimitedTag[],
): boolean => {
  return expectedAudienceSlugs.every((slug) =>
    audienceTags.some(tagMatchesSlug(slug)),
  );
};

export const findMatchingAudienceTags = (
  intendedAudience: string | undefined,
  audienceTags: LimitedTag[],
): LimitedTag[] => {
  if (!intendedAudience) {
    return [];
  }
  const selectedValues = intendedAudience.split(",");
  const tags: LimitedTag[] = [];

  selectedValues.forEach((slug) => {
    const matchingTag = audienceTags.find(tagMatchesSlug(slug));
    if (matchingTag) {
      tags.push(matchingTag);
      return;
    }
    console.warn("could not find an audience tag for:", slug);
  });

  return tags;
};

export const intendedAudienceTooltip = {
  text: "find out more about Intended audience",
  docUrl:
    "https://docs.google.com/document/d/1_NMKSsWq5cGUNGr2JcDmwkGxXK82thTUp0xzt5BkjTQ/edit?tab=t.0#heading=h.lbvu212ng3qf",
};

export const getTrackingTagsFromAudienceOption = (
  stub: Stub,
  optionValue: IntendedAudienceOptionValue,
  audienceTags: LimitedTag[],
): string[] => {
  const intendedAudience = getIntendedAudienceFromOptionValue(optionValue, stub);
  return findMatchingAudienceTags(intendedAudience, audienceTags)
    .map(tag => tag.path)
    .filter(path => path !== undefined);
}

export const findTagsByPath = (paths: string[], audienceTags: LimitedTag[]): LimitedTag[] =>
  audienceTags.filter(tag => tag.path && paths.includes(tag.path));
