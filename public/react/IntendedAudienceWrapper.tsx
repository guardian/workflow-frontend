import {
  IntendedAudienceSignifier,
  mapTagsToSourceAndTarget
} from "@guardian/stand/IntendedAudienceSignifier";
import React from "react";

type Props = {
  intendedAudience?: string;
};

const getSourceAndTarget = (intendedAudience?: string) => {
  if (!intendedAudience) {
    return undefined;
  }

  // We intend to deprecate the stub.externalData.intendedAudience (Option[String], comma separated tag slugs) and use
  // stub.externalData.trackingTags (Option[List[String]], array of tag paths)

  return mapTagsToSourceAndTarget(
    intendedAudience.toLowerCase()
      .split(",")
      .map((slug) => ({ path: `tracking/audience/${slug}` })),
  );
};

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  intendedAudience,
}: Props) => {
  const sourceAndTarget = getSourceAndTarget(intendedAudience);
  if (!sourceAndTarget) {
    return null; // do not render the "Don't know" signifier in the table
  }

  return (
    <IntendedAudienceSignifier
      target={sourceAndTarget.target}
      source={sourceAndTarget.source}
    />
  );
};
