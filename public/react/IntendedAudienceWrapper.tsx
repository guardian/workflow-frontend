import {
  IntendedAudienceSignifier,
  mapTagsToSourceAndTarget
} from "@guardian/stand/IntendedAudienceSignifier";
import React from "react";

type Props = {
  trackingTags?: string[];
};

const getSourceAndTarget = (trackingTags?: string[]) => {
  if (!trackingTags) {
    return undefined;
  }

  return mapTagsToSourceAndTarget(
    trackingTags.map((path) => ({ path })),
  );
};

export const IntendedAudienceWrapper: React.FunctionComponent<Props> = ({
  trackingTags,
}: Props) => {
  const sourceAndTarget = getSourceAndTarget(trackingTags);
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
