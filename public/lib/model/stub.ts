export type ComposerContentType =
  | "article"
  | "liveblog"
  | "gallery"
  | "interactive"
  | "picture"
  | "video"
  | "audio"

export type SpecialFormatContentType =
  | "keyTakeaways"
  | "qAndA"
  | "timeline"
  | "miniProfiles"
  | "multiByline";

export type ContentType = ComposerContentType | SpecialFormatContentType;

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
  displayHint?: string;
};

export type SpecialArticleFormat = {
  label: string,
  value: SpecialFormatContentType,
  iconId: string,
  hidden?: boolean,
}

