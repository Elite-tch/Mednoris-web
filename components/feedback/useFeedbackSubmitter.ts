"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useCrypto } from "@/contexts/CryptoContext";
import { decryptData } from "@/lib/crypto";

export interface FeedbackSubmitter {
  uid: string | null;
  name: string;
  role: string;
  hospitalSlug: string;
  authType: "firebase" | "anonymous";
}

const ANONYMOUS: FeedbackSubmitter = {
  uid: null,
  name: "anonymous",
  role: "guest",
  hospitalSlug: "",
  authType: "anonymous",
};

export function useFeedbackSubmitter(): FeedbackSubmitter {
  const params = useParams();
  const slug = (params.slug as string) ?? "";
  const { dek } = useCrypto();
  const [submitter, setSubmitter] = useState<FeedbackSubmitter>({
    ...ANONYMOUS,
    hospitalSlug: slug,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSubmitter({ ...ANONYMOUS, hospitalSlug: slug });
        return;
      }

      const staffSnap = await getDoc(doc(db, "hospital_staff", user.uid));
      if (!staffSnap.exists()) {
        setSubmitter({
          uid: user.uid,
          name: "anonymous",
          role: "guest",
          hospitalSlug: slug,
          authType: "firebase",
        });
        return;
      }

      const data = staffSnap.data();
      let name = data.name ?? "Staff member";

      if (data.encryptedProfile && dek) {
        try {
          const profile = await decryptData(
            data.encryptedProfile.ciphertext,
            data.encryptedProfile.iv,
            dek
          );
          name = profile.name ?? name;
        } catch {
          // Keep fallback name
        }
      }

      setSubmitter({
        uid: user.uid,
        name,
        role: data.role ?? "staff",
        hospitalSlug: data.hospitalSlug ?? slug,
        authType: "firebase",
      });
    });

    return () => unsubscribe();
  }, [slug, dek]);

  return submitter;
}
