import React, { useEffect, useMemo, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredPartners = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return partners.filter((partner) => {
      const category = partner?.category || partner?.industry || "";
      return (
        String(partner?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(partner?.contactEmail || "")
          .toLowerCase()
          .includes(query) ||
        String(category).toLowerCase().includes(query)
      );
    });
  }, [partners, searchTerm]);

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
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold">Partners Table</h3>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search partner, email, category"
            className="w-full max-w-sm bg-black border border-zinc-700 px-3 py-2 rounded-lg text-xs text-zinc-200 placeholder-zinc-500"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="border border-zinc-800 bg-[#0f0f0f] rounded-lg overflow-hidden">
            <div className="max-h-[28rem] overflow-y-auto hide-scrollbar">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-black border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-300 border-r border-zinc-800">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-300 border-r border-zinc-800">
                        NAME
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-300 border-r border-zinc-800">
                        CATEGORY
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-300 border-r border-zinc-800">
                        TYPE
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-300 border-r border-zinc-800">
                        CONTACT
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-zinc-300 border-r border-zinc-800">
                        OFFERS
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-zinc-300 border-r border-zinc-800">
                        STATUS
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-zinc-300">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-3 py-8 text-center text-zinc-500"
                        >
                          No partners found.
                        </td>
                      </tr>
                    ) : (
                      filteredPartners.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-zinc-800/70 hover:bg-zinc-900/60"
                        >
                          <td className="px-3 py-2 text-zinc-400 border-r border-zinc-800">
                            {p.id}
                          </td>
                          <td className="px-3 py-2 text-white border-r border-zinc-800">
                            {p.name}
                          </td>
                          <td className="px-3 py-2 text-zinc-300 border-r border-zinc-800">
                            {p.category || p.industry || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-zinc-300 border-r border-zinc-800">
                            {p.type || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-zinc-400 border-r border-zinc-800">
                            {p.contactEmail || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-center text-zinc-300 border-r border-zinc-800">
                            {Array.isArray(p.offers) ? p.offers.length : 0}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-zinc-800">
                            <span
                              className={
                                p.isActive
                                  ? "text-green-400 font-semibold"
                                  : "text-amber-400 font-semibold"
                              }
                            >
                              {p.isActive ? "APPROVED" : "PENDING"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  partnersApi.toggle(p.id, !p.isActive).then(load)
                                }
                                className="text-[11px] px-2.5 py-1 rounded border border-zinc-700 hover:bg-zinc-800"
                              >
                                {p.isActive ? "Set Pending" : "Approve"}
                              </button>
                              <button
                                onClick={() => rotateKey(p.id)}
                                className="text-[11px] px-2.5 py-1 rounded border border-zinc-700 hover:bg-zinc-800"
                              >
                                Rotate Key
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-black border-t border-zinc-800 px-3 py-2 text-xs text-zinc-500">
              Records: {filteredPartners.length} / Total: {partners.length}
            </div>
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
