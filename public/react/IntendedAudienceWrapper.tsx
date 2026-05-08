import React from "react";
import {
  IntendedAudienceSignifier,
  type IntendedAudienceSignifierProps,
} from "@guardian/stand/intendedAudienceSignifier";

type Props = {
  intendedAudience?: string;
  source?: string;
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

const parseSource = (
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

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  intendedAudience,
  source,
}: Props) => {
  return (
    <IntendedAudienceSignifier
      intendedAudience={parseAudience(intendedAudience)}
      source={parseSource(source)}
      theme={{
        svg: {
          width: "13px",
          height: "10px",
        },
        typography: {
          fontSize: "12px",
        },
      }}
    />
  );
};
