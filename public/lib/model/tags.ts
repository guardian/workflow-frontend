import { type IntendedAudienceSignifierProps } from "@guardian/stand/intendedAudienceSignifier";

type LimitedTag = {
  id: number;
  externalName: string;
  path?: string;
};

type AudienceTag = {
  id: number;
  externalName: string;
  intendedAudience: IntendedAudienceSignifierProps["intendedAudience"];
};

const pathToIntendedAudience = (
  path: string,
): IntendedAudienceSignifierProps["intendedAudience"]|undefined => {
  const slug = path.split("/").pop();

  switch (slug) {
    case "domestic-for-domestic":
      return "Domestic for Domestic";
    case "domestic-for-global":
      return "Domestic For Global";
    case "don-t-know":
      return "Don't know";
    case "global":
      return "Global";
    default:
      return undefined;
  }
};

export const parseLimitedTagsToAudienceTags = (
  limitedTags: LimitedTag[],
): AudienceTag[] =>
  limitedTags.flatMap((tag) => {
    const { path, id, externalName } = tag;

    if (!path) {
      return [];
    }

    const intendedAudience = pathToIntendedAudience(path);

    return intendedAudience
      ? {
          id,
          externalName,
          intendedAudience,
        }
      : [];
  });
