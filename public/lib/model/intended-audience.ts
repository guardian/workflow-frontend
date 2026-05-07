export const fixCasing = (rawValue: string): string => {
  switch (rawValue) {
    case "Domestic For Domestic":
      return "Domestic for Domestic";
    default:
      return rawValue;
  }
};
