import React, { useEffect, useState } from "react";
import partnersApi from "../../api/partnersApi";

const CATEGORIES = [
  "FOOD",
  "HAIR_SALON",
  "FASHION",
  "BEAUTY",
  "FITNESS",
  "ENTERTAINMENT",
  "OTHER",
];

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState("");
  const [keyOutput, setKeyOutput] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await partnersApi.getAllAdmin();
      setPartners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load partners:", e);
      setPartners([]);
      setSeedStatus(e?.response?.data?.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const seedDefaults = async () => {
    setSeedStatus("Seeding defaults...");
    try {
      await partnersApi.seedDefaults();
      setSeedStatus("Default partners/offers seeded.");
      await load();
    } catch (e) {
      setSeedStatus(e?.response?.data?.message || "Seed failed");
    }
  };

  const rotateKey = async (partnerId) => {
    try {
      const key = await partnersApi.rotateKey(partnerId);
      setKeyOutput(`Partner: ${key.partnerName}\nKey: ${key.apiKey}`);
    } catch (e) {
      setKeyOutput(e?.response?.data?.message || "Failed to rotate key");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#121212] border border-gray-800 rounded-xl p-4">
        <h2 className="text-lg font-semibold">Partner Seed & Setup</h2>
        <p className="text-xs text-gray-400 mt-1">
          One-click seed for categories and default offers so rewards
          marketplace is instantly populated.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="px-2 py-1 text-[10px] rounded border border-gray-700 text-gray-300"
            >
              {c}
            </span>
          ))}
        </div>
        <button
          onClick={seedDefaults}
          className="mt-4 bg-[#c0f24d] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110"
        >
          Seed Default Partners & Offers
        </button>
        {seedStatus && (
          <p className="text-xs text-gray-300 mt-2">{seedStatus}</p>
        )}
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-xl p-4">
        <h3 className="text-base font-semibold mb-3">Partner API Keys</h3>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-2">
            {partners.map((p) => (
              <div
                key={p.id}
                className="bg-[#0f0f0f] border border-gray-800 rounded-lg px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white font-medium">{p.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {p.category} · {p.type} ·{" "}
                    {p.isActive ? "APPROVED" : "PENDING"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      partnersApi.toggle(p.id, !p.isActive).then(load)
                    }
                    className="text-xs px-3 py-1.5 rounded border border-gray-700 hover:bg-[#1a1a1a]"
                  >
                    {p.isActive ? "Set Pending" : "Approve"}
                  </button>
                  <button
                    onClick={() => rotateKey(p.id)}
                    className="text-xs px-3 py-1.5 rounded border border-gray-700 hover:bg-[#1a1a1a]"
                  >
                    Rotate Key
                  </button>
                </div>
              </div>
            ))}
            {partners.length === 0 && (
              <p className="text-xs text-gray-500">No partners yet.</p>
            )}
          </div>
        )}

        {keyOutput && (
          <pre className="mt-4 whitespace-pre-wrap text-xs bg-black border border-gray-800 rounded-lg p-3 text-[#c0f24d] overflow-x-auto">
            {keyOutput}
          </pre>
        )}
      </div>
    </div>
  );
}
