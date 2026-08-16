import { db } from "@/lib/firebase";
import { runTransaction, doc, collection } from "firebase/firestore";

/**
 * Computes a SHA-256 hash using the Web Crypto API
 */
async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Writes a tamper-evident, hash-chained audit log.
 * Uses a Firestore transaction to prevent race conditions on the chain.
 * 
 * @param slug The hospital slug
 * @param actionData The data representing the audit log action
 */
export async function writeAuditLog(slug: string, actionData: any): Promise<void> {
  const metadataRef = doc(db, "hospitals", slug, "audit_metadata", "chain");
  const auditLogsRef = collection(db, "audit_logs");
  const newLogRef = doc(auditLogsRef);

  await runTransaction(db, async (transaction) => {
    // 1. Read the current head of the chain
    const metadataSnap = await transaction.get(metadataRef);
    let previousHash = "";

    if (metadataSnap.exists()) {
      previousHash = metadataSnap.data().lastLogHash || "";
    }

    // 2. Compute the new hash
    // We include previousHash + stringified actionData. We sort the keys for deterministic JSON output.
    const sortedActionData = Object.keys(actionData)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = actionData[key];
        return acc;
      }, {});
      
    const dataString = JSON.stringify(sortedActionData);
    const currentHash = await computeHash(previousHash + dataString);

    // 3. Prepare the log document payload
    const logPayload = {
      ...actionData,
      hospitalSlug: slug,
      previousHash,
      currentHash,
      timestamp: new Date().toISOString()
    };

    // 4. Write the new log and update the chain metadata
    transaction.set(newLogRef, logPayload);
    transaction.set(metadataRef, {
      lastLogHash: currentHash,
      lastLogId: newLogRef.id,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  });
}
