import { generateKeyPairSync } from "node:crypto";

export interface PanDomainKeys {
  privateKeyPem: string;
  publicKeyPem: string;
  /** base64 of the DER body, i.e. PEM with the armour and newlines stripped. */
  privateKeyBase64: string;
  publicKeyBase64: string;
}

const pemToBase64 = (pem: string): string =>
  pem
    .split("\n")
    .filter((line) => !line.startsWith("-----") && line.trim() !== "")
    .join("");

/** Generate a fresh RSA keypair per run for signing/verifying pan-domain cookies. */
export function generatePanDomainKeys(): PanDomainKeys {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    privateKeyBase64: pemToBase64(privateKey),
    publicKeyBase64: pemToBase64(publicKey),
  };
}
