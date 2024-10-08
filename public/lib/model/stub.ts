export type ContentType =
  | "article"
  | "liveblog"
  | "gallery"
  | "interactive"
  | "picture"
  | "video"
  | "audio"
  | "keyTakeaways"
  | "qAndA"
  | "timeline"
  | "miniProfiles";

type FlagValue = "NA" | "REQUIRED" | "COMPLETE";

export type Stub = {
  title?: string;
  articleFormat?: string;
  contentType: ContentType;
  commissionedLength?: number;
  missingCommissionedLengthReason?: string | null | undefined;
  needsLegal?: FlagValue;
  needsPictureDesk?: FlagValue;
  priority?: number;
  prodOffice?: string;
  note?: string;
};

