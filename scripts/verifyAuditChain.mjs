/**
 * Mednoris Audit Chain Verification Script
 * 
 * This script connects to Firestore, downloads all audit_logs for a given
 * hospital, then walks the hash chain in order to verify tamper-evidence.
 * 
 * Usage: node scripts/verifyAuditChain.mjs <hospitalSlug>
 * 
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to your service account JSON path
 *   - npm install firebase-admin
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "crypto";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/verifyAuditChain.mjs <hospitalSlug>");
  process.exit(1);
}

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json") });
}
const db = getFirestore();

function computeHash(data) {
  return createHash("sha256").update(data).digest("hex");
}

async function verify() {
  console.log(`\n🔍 Verifying audit chain for hospital: ${slug}\n`);

  const snapshot = await db
    .collection("audit_logs")
    .where("hospitalSlug", "==", slug)
    .orderBy("timestamp", "asc")
    .get();

  if (snapshot.empty) {
    console.log("No audit logs found for this hospital.");
    return;
  }

  const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${logs.length} audit log entries.\n`);

  let valid = true;
  let prevHash = "";

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const { previousHash, currentHash, timestamp, action, actorName, ...rest } = log;

    // Recompute the hash from the action data (sorted keys, same as writeAuditLog)
    const actionData = { action, actorName, ...rest };
    delete actionData.id;
    delete actionData.previousHash;
    delete actionData.currentHash;

    const sortedActionData = Object.keys(actionData)
      .sort()
      .reduce((acc, key) => { acc[key] = actionData[key]; return acc; }, {});

    const expectedHash = computeHash(prevHash + JSON.stringify(sortedActionData));

    const prevHashOk = (previousHash === prevHash);
    const currentHashOk = (currentHash === expectedHash);
    const ok = prevHashOk && currentHashOk;

    const status = ok ? "✅" : "❌ TAMPERED";
    console.log(`[${i + 1}] ${status} | ${timestamp} | ${actorName} | ${action?.slice(0, 60)}`);
    if (!ok) {
      if (!prevHashOk) console.log(`        previousHash mismatch:\n         stored: ${previousHash}\n         expected: ${prevHash}`);
      if (!currentHashOk) console.log(`        currentHash mismatch:\n         stored: ${currentHash}\n         expected: ${expectedHash}`);
      valid = false;
    }

    prevHash = currentHash;
  }

  console.log(`\n${valid ? "✅ Audit chain is intact. No tampering detected." : "❌ CHAIN BROKEN — tampering detected in one or more entries."}\n`);
}

verify().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
