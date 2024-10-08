import { ContentType, Stub } from "./model/stub";

const MESSAGING = {
  commissionLengthRequired: "A commissioned length is required",
};

const doesContentTypeRequireCommissionedLength = (contentType: ContentType) => {
  switch (contentType) {
    case "liveblog":
    case "gallery":
    case "picture":
    case "video":
    case "audio":
      return false;
    case "article":
    case "interactive":
    case "keyTakeaways":
    case "qAndA":
    case "timeline":
    case "miniProfiles":
    default:
      return true;
  }
};

const stubIsMissingRequiredLength = (stub: Stub) =>
  doesContentTypeRequireCommissionedLength(stub.contentType) &&
  !stub.commissionedLength &&
  !stub.missingCommissionedLengthReason;

const generateErrorMessages = (stub: Stub): string[] | undefined => {
  const errors: string[] = [];
  if (stubIsMissingRequiredLength(stub)) {
    errors.push(MESSAGING.commissionLengthRequired);
  }
  return errors.length > 0 ? errors : undefined;
};

const useNativeFormFeedback = (stub: Stub) => {
  const formElement = document.querySelector<HTMLFormElement>(
    "form[name=stubForm]"
  );
  if (!formElement) {
    return;
  }

  const commissionedLengthInput = formElement.querySelector<HTMLInputElement>(
    "input[name=commissionedLength]"
  );
  if (commissionedLengthInput) {
    if (stubIsMissingRequiredLength(stub)) {
      commissionedLengthInput.setCustomValidity(
        MESSAGING.commissionLengthRequired
      );
    } else {
      commissionedLengthInput.setCustomValidity("");
    }
  }

  formElement.reportValidity();
};

export {
  generateErrorMessages,
  doesContentTypeRequireCommissionedLength,
  useNativeFormFeedback,
};
