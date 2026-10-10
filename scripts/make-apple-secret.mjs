// Makes the Sign in with Apple client secret (an ES256 JWT) from the .p8 key, on this machine. Apple caps it at
// about 6 months, so it has to be made again and pasted into Supabase (Apple provider → Secret Key) before it expires.
// Keep the .p8 and the output outside the repo; neither is ever printed.
// npm run apple:secret -- <AuthKey_XXXX.p8> <teamId> <keyId> <servicesId> <outFile>
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const [keyPath, teamId, keyId, clientId, outFile] = process.argv.slice(2);
if (!outFile) {
  console.error("usage: npm run apple:secret -- <AuthKey_XXXX.p8> <teamId> <keyId> <servicesId> <outFile>");
  process.exit(1);
}

// Apple's limit is 15777000 s; an hour under it
const now = Math.floor(Date.now() / 1000);
const exp = now + 15777000 - 3600;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const data = `${b64({ alg: "ES256", kid: keyId, typ: "JWT" })}.${b64({ iss: teamId, iat: now, exp, aud: "https://appleid.apple.com", sub: clientId })}`;
const signature = sign("sha256", Buffer.from(data), { key: createPrivateKey(readFileSync(keyPath)), dsaEncoding: "ieee-p1363" });
writeFileSync(outFile, `${data}.${signature.toString("base64url")}`, { mode: 0o600 });
console.log(`Client secret written to ${outFile}. It expires ${new Date(exp * 1000).toISOString().slice(0, 10)}.`);
