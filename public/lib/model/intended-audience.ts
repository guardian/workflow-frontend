import { Stub } from "./stub";
import { LimitedTag } from "./tags";

type IntendedAudienceOptionValue =
  | "domestic-for-domestic"
  | "domestic-for-global"
  | "global"
  | "don-t-know"
  | null;

type AudienceTagSlug = "global" | "uk" | "au" | "us";
const expectedAudienceSlugs = ["global", "uk", "au", "us"];

export const isAudienceTagSlug = (text: string) =>
  expectedAudienceSlugs.includes(text);

export const intendedAudienceOptions: {
  displayName: string;
  value: IntendedAudienceOptionValue;
}[] = [
  {
    displayName: "",
    value: null,
  },
  {
    displayName: "Don't know",
    value: "don-t-know",
  },
  {
    displayName: "Domestic for Domestic",
    value: "domestic-for-domestic",
  },
  {
    displayName: "Domestic for Global",
    value: "domestic-for-global",
  },
  {
    displayName: "Global",
    value: "global",
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
