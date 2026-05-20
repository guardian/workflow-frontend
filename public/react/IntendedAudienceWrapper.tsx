import {
  IntendedAudienceSignifier,
  type IntendedAudienceSignifierProps,
} from "@guardian/stand/intendedAudienceSignifier";
import React from "react";
import { isAudienceTagSlug } from "../lib/model/intended-audience";

type Props = {
  intendedAudience?: string;
  productionOffice?: string;
};

const parseProductionOfficeToSource = (
  source?: string,
): IntendedAudienceSignifierProps["source"] => {
  if (!source) {
    return "UK";
  }
  switch (source?.toUpperCase()) {
    case "US":
      return "US";
    case "AUS":
      return "AUS";
    case "UK":
    default:
      return "UK";
  }
};

const slugsToSource = (
  audienceTagTokens: string[],
): IntendedAudienceSignifierProps["source"] => {
  if (audienceTagTokens.includes("au")) {
    return "AUS";
  }
  if (audienceTagTokens.includes("us")) {
    return "US";
  }
  return "UK";
};

const slugsToIntendedAudience = (
  audienceTagTokens: string[],
): IntendedAudienceSignifierProps["intendedAudience"] => {
  if (audienceTagTokens.length === 0) {
    return "Don't know";
  }
  if (audienceTagTokens.includes("global")) {
    return audienceTagTokens.length === 1 ? "Global" : "Domestic For Global";
  }
  return "Domestic for Domestic";
};

const deriveProps = (
  stubIntendedAudience: string | undefined,
  productionOffice: string | undefined,
): {
  source: IntendedAudienceSignifierProps["source"];
  intendedAudience: IntendedAudienceSignifierProps["intendedAudience"];
} => {
  if (!stubIntendedAudience) {
    return {
      source: parseProductionOfficeToSource(productionOffice),
      intendedAudience: "Don't know",
    };
  }

  const audienceTagSlugs = stubIntendedAudience
    .split(",")
    .filter(isAudienceTagSlug);

  return {
    source: slugsToSource(audienceTagSlugs),
    intendedAudience: slugsToIntendedAudience(audienceTagSlugs),
  };
};

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  intendedAudience: stubIntendedAudience,
  productionOffice,
}: Props) => {
  const { intendedAudience, source } = deriveProps(
    stubIntendedAudience,
    productionOffice,
  );

  return (
    <IntendedAudienceSignifier
      intendedAudience={intendedAudience}
      source={source}
      theme={{
        svg: {
          width: "16px",
          height: "12px",
        },
        typography: {
          font: "normal 460 12px GuardianAgateSans1Web",
        },
      }}
    />
  );
};
