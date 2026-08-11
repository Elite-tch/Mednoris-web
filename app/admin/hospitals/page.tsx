"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Building2, Search, Link as LinkIcon, AlertCircle } from "lucide-react";
import ProvisionHospitalModal from "@/components/admin/ProvisionHospitalModal";

export default function HospitalsAdminPage() {
  const [activeTab, setActiveTab] = useState<"active" | "requests">("requests");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For the modal
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Active Hospitals
      const hospSnap = await getDocs(query(collection(db, "hospitals"), orderBy("createdAt", "desc")));
      setHospitals(hospSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Fetch Pending Demo Requests
      const reqSnap = await getDocs(query(collection(db, "hospital_demo_requests"), where("status", "==", "pending")));
      // Sort locally to avoid needing immediate composite index
      const reqs = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      reqs.sort((a: any, b: any) => (b.submittedAt?.toMillis() || 0) - (a.submittedAt?.toMillis() || 0));
      setRequests(reqs);
    } catch (e) {
      console.error("Error fetching hospitals data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProvisionClick = (req: any) => {
    setSelectedRequest(req);
    setIsProvisionModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Hospitals (B2B)</h1>
          <p className="text-gray-500">Manage onboarded hospitals and demo requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("requests")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Demo Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Active / Pending Setup ({hospitals.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === "requests" ? (
            <div className="divide-y divide-gray-50">
              {requests.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No pending demo requests right now.
                </div>
              ) : (
                requests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{req.hospitalName}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{req.contactName} ({req.role})</span>
                        <span>&bull;</span>
                        <span>{req.email}</span>
                        <span>&bull;</span>
                        <span>{req.city}, {req.country}</span>
                      </div>
                      <div className="mt-3 inline-flex flex-wrap gap-2">
                        {req.facilityType?.map((ft: string) => (
                          <span key={ft} className="px-2 py-1 bg-gray-100 text-xs font-semibold rounded-md text-gray-600">
                            {ft}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => handleProvisionClick(req)}
                        className="px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary transition-colors"
                      >
                        Approve & Provision
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {hospitals.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No hospitals have been provisioned yet.
                </div>
              ) : (
                hospitals.map((hosp) => (
                  <motion.div
                    key={hosp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{hosp.name}</h3>
                        <p className="text-sm text-gray-500">{hosp.contactEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {hosp.status === "pending_setup" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">
                          <AlertCircle size={14} />
                          Pending Setup
                        </span>
                      )}
                      {hosp.status === "active" && (
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                          Active
                        </span>
                      )}
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-medium">Workspace Slug</span>
                        <span className="text-sm font-bold text-gray-900">/h/{hosp.slug}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedRequest({
                            ...hosp,
                            hospitalName: hosp.name,
                            isAlreadyProvisioned: true,
                          });
                          setIsProvisionModalOpen(true);
                        }}
                        className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors shrink-0"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Provisioning Modal */}
      {isProvisionModalOpen && (
        <ProvisionHospitalModal
          request={selectedRequest}
          onClose={() => setIsProvisionModalOpen(false)}
          onSuccess={() => {
            setIsProvisionModalOpen(false);
            fetchData(); // Refresh lists
          }}
        />
      )}
    </div>
  );
}
