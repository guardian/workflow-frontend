import { ContentType, Stub } from "./model/stub";

const isCommissionedLengthRequired = (contentType: ContentType) => {
  return ["interactive", "article"].includes(contentType);
};

const generateErrorMessages = (stub: Stub): string[] | undefined => {
  const errors: string[] = [];

  if (
    isCommissionedLengthRequired(stub.contentType) &&
    !stub.commissionedLength
  ) {
    errors.push("A commissioned length is required");
  }

  return errors.length > 0 ? errors : undefined;
};

export { generateErrorMessages, isCommissionedLengthRequired };
