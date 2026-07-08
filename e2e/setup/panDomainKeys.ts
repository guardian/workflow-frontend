import { generateKeyPairSync } from "crypto";

export type PanDomainKeys = {
    privateKeyPem: string;
    privateKeyBase64: string;
    publicKeyBase64: string;
};

export function pemToBase64(key: string): string {
    return key
        .replace(/-----BEGIN [^-]+-----/g, "")
        .replace(/-----END [^-]+-----/g, "")
        .replace(/\s+/g, "");
}

export function generatePanDomainKeys(): PanDomainKeys {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return {
        privateKeyPem: privateKey,
        privateKeyBase64: pemToBase64(privateKey),
        publicKeyBase64: pemToBase64(publicKey),
    };
}
