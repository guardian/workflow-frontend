import React from "react";
import {
  IntendedAudienceSignifier,
  type IntendedAudienceSignifierProps,
} from "@guardian/stand/intendedAudienceSignifier";

type SimplifiedTag = {
  id: number;
  externalName: string;
  path?: string;
};

type Props = {
  intendedAudience?: string;
  commissioningDesks?: SimplifiedTag[];
  productionOffice?: string;
};

const parseAudience = (
  intendedAudience?: string,
): IntendedAudienceSignifierProps["intendedAudience"] => {
  if (!intendedAudience) {
    return "Don't know";
  }

  switch (intendedAudience.toUpperCase()) {
    case "GLOBAL":
      return "Global";
    case "DOMESTIC FOR DOMESTIC":
      return "Domestic for Domestic";
    case "DOMESTIC FOR GLOBAL":
      return "Domestic For Global";

    case "UK":
      return "UK";
    case "US":
      return "US";
    case "AUS":
      return "AUS";
    case "DON'T KNOW":
    default:
      return "Don't know";
  }
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

const PREFIXES: IntendedAudienceSignifierProps["source"][] = [
  "UK",
  "AUS",
  "US",
];

const deriveSourceFromCommissioningDesks = (
  desks: SimplifiedTag[],
): IntendedAudienceSignifierProps["source"] | undefined => {
  const deskWithPrefix = desks.find((deskName) =>
    PREFIXES.some((prefix) =>
      deskName.externalName.toUpperCase().startsWith(prefix),
    ),
  );

  if (!deskWithPrefix) {
    return undefined;
  }

  return PREFIXES.find((prefix) =>
    deskWithPrefix.externalName.toUpperCase().startsWith(prefix),
  );
};

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  intendedAudience,
  productionOffice,
  commissioningDesks = [],
}: Props) => {
  return (
    <IntendedAudienceSignifier
      intendedAudience={parseAudience(intendedAudience)}
      source={
        deriveSourceFromCommissioningDesks(commissioningDesks) ??
        parseProductionOfficeToSource(productionOffice)
      }
      theme={{
        svg: {
          width: "12px",
          height: "12px",
        },
        typography: {
          font: "normal 460 12px GuardianAgateSans1Web",
        },
      }}
    />
  );
};
