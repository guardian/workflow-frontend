import {
  IntendedAudienceSignifier,
  type IntendedAudienceSignifierProps,
} from "@guardian/stand/IntendedAudienceSignifier";
import React from "react";
import { isAudienceTagSlug } from "../lib/model/intended-audience";

type Props = {
  intendedAudience?: string;
};

type DomesticRegion = "UK" | "US" | "AUS";

const getHasGlobal = (audienceTagTokens: string[]): boolean =>
  audienceTagTokens.includes("global");

const getDomesticRegion = (
  audienceTagTokens: string[],
): DomesticRegion | undefined => {
  if (audienceTagTokens.includes("au")) {
    return "AUS";
  }
  if (audienceTagTokens.includes("us")) {
    return "US";
  }
  if (audienceTagTokens.includes("uk")) {
    return "UK";
  }
  return undefined;
};

const slugsToSource = (
  hasGlobal: boolean,
  domesticRegion: DomesticRegion | undefined,
): IntendedAudienceSignifierProps["source"] => {
  if (domesticRegion) {
    return domesticRegion;
  }
  return hasGlobal ? "global" : undefined;
};

const slugsToTarget = (
  hasGlobal: boolean,
  domesticRegion: DomesticRegion | undefined,
): IntendedAudienceSignifierProps["target"] => {
  if (hasGlobal) {
    return "global";
  }
  return domesticRegion;
};

const deriveProps = (
  stubIntendedAudience: string | undefined,
): {
  source: IntendedAudienceSignifierProps["source"];
  target: IntendedAudienceSignifierProps["target"];
} => {
  if (!stubIntendedAudience) {
    return {
      source: undefined,
      target: undefined,
    };
  }

  const audienceTagSlugs = stubIntendedAudience
    .split(",")
    .filter(isAudienceTagSlug);

  const hasGlobal = getHasGlobal(audienceTagSlugs);
  const domesticRegion = getDomesticRegion(audienceTagSlugs);

  return {
    source: slugsToSource(hasGlobal, domesticRegion),
    target: slugsToTarget(hasGlobal, domesticRegion),
  };
};

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  intendedAudience: stubIntendedAudience,
}: Props) => {
  const { target, source } = deriveProps(stubIntendedAudience);

  return (
    <IntendedAudienceSignifier
      target={target}
      source={source}
      theme={{
        typography: {
          font: "normal 460 12px GuardianAgateSans1Web",
        },
      }}
    />
  );
};
