import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import partnersApi from "../../api/partnersApi";

import { useEffect, useState } from "react";

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    partnersApi.getMine().then(setPartner).catch(() => setPartner(null));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">
            Partner Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Welcome, {user?.name || user?.firstName || "Partner"}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Manage customer redemption flow and access partner tools. Your public
            profile and offers are managed by admin approval and partner settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            title="Partner Scanner"
            description="Scan customer QR tokens and verify rewards in-store."
            to="/partner-scanner"
            cta="Open Scanner"
          />
          <Card
            title="Partners Directory"
            description="Open your public-facing partner profile and see how customers view your brand."
            to={partner?.id ? `/partners/${partner.id}` : "/partners"}
            cta="Open Public Profile"
          />
          <Card
            title="Edit Partner Profile"
            description="Manage cover media, about blocks, gallery, and headline content."
            to="/partner-profile-edit"
            cta="Open Editor"
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, description, to, cta }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111111] p-5 flex flex-col">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-zinc-400 mt-2 flex-1">{description}</p>
      <Link
        to={to}
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-[#c0f24d] hover:text-[#c0f24d] transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
