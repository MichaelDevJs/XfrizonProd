import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import partnersApi from "../../api/partnersApi";

export default function PartnerProfilePage() {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    partnersApi
      .getById(partnerId)
      .then(setPartner)
      .catch((e) => setError(e?.response?.data?.message || "Partner not found"))
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading partner profile...
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error || "Partner not found"}</p>
          <Link
            to="/partners"
            className="text-[#c0f24d] text-sm mt-2 inline-block"
          >
            Back to partners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Link to="/partners" className="text-xs text-gray-400 hover:text-white">
          ← Back to Partners
        </Link>

        <div className="mt-4 bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            {partner.logoUrl ? (
              <img
                src={partner.logoUrl}
                alt={partner.name}
                className="w-24 h-24 object-contain rounded-xl bg-[#0c0c0c] p-2 border border-gray-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-[#c0f24d]/10 flex items-center justify-center border border-gray-800 text-3xl font-bold text-[#c0f24d]">
                {partner.name?.charAt(0)}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">{partner.name}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {partner.industry} · {partner.type}
              </p>
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#c0f24d] text-sm hover:underline"
                >
                  {partner.website}
                </a>
              )}
            </div>
          </div>

          {partner.description && (
            <p className="mt-5 text-gray-300 text-sm leading-relaxed">
              {partner.description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Info label="Industry" value={partner.industry} />
            <Info label="Location" value={partner.location} />
            <Info label="Address" value={partner.address} />
            <Info label="Contact Email" value={partner.contactEmail} />
            <Info label="Contact Phone" value={partner.contactPhone} />
          </div>
        </div>

        <div className="mt-6 bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Offers</h2>
          <div className="mt-3 space-y-2">
            {(partner.offers || []).length === 0 && (
              <p className="text-gray-500 text-sm">
                No active offers available right now.
              </p>
            )}
            {(partner.offers || []).map((offer) => (
              <div
                key={offer.id}
                className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{offer.title}</p>
                  <p className="text-xs text-gray-500">{offer.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#c0f24d] font-bold text-sm">
                    {offer.discountPercent}% OFF
                  </p>
                  <p className="text-gray-500 text-xs">
                    {offer.pointsCost} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-white mt-0.5">{value || "-"}</p>
    </div>
  );
}
