import React, { useCallback, useEffect, useState } from "react";
import pointsApi from "../../api/pointsApi";

const TIER_CONFIG = {
  GOLD: {
    color: "text-yellow-400",
    bar: "bg-yellow-400",
    label: "Gold",
    next: null,
    discount: 20,
  },
  SILVER: {
    color: "text-gray-300",
    bar: "bg-gray-300",
    label: "Silver",
    next: 2000,
    discount: 15,
  },
  BRONZE: {
    color: "text-amber-600",
    bar: "bg-amber-600",
    label: "Bronze",
    next: 1000,
    discount: 10,
  },
  NONE: {
    color: "text-gray-500",
    bar: "bg-gray-700",
    label: "—",
    next: 500,
    discount: 0,
  },
};

const XF_DEBIT_LOGO_SRC = "/assets/Xfrizon%20Logo%20(5).png";

export default function PointsWallet() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("wallet"); // "wallet" | "history"

  const loadPointsData = useCallback(async () => {
    try {
      if (!wallet && !ledger) {
        setLoading(true);
      }

      const [w, l] = await Promise.all([
        pointsApi.getWallet(),
        pointsApi.getLedger(0, 10),
      ]);
      setWallet(w);
      setLedger(l);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [wallet, ledger]);

  useEffect(() => {
    loadPointsData();
  }, [loadPointsData]);

  useEffect(() => {
    const handlePointsRefresh = () => {
      loadPointsData();
    };

    window.addEventListener("points:refresh", handlePointsRefresh);
    return () => {
      window.removeEventListener("points:refresh", handlePointsRefresh);
    };
  }, [loadPointsData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 border-2 border-[#c0f24d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        Unable to load wallet. Please try again.
      </div>
    );
  }

  const tier = TIER_CONFIG[wallet.tier] || TIER_CONFIG.NONE;
  const progress = tier.next
    ? Math.min((wallet.availableBalance / tier.next) * 100, 100)
    : 100;

  const isDebitTransaction = (tx) => {
    if (typeof tx?.points === "number") {
      return tx.points < 0;
    }
    return false;
  };

  return (
    <div className="bg-[#111] rounded-2xl border border-gray-800 p-6 max-w-lg mx-auto w-full">
      {/* Wallet Card */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              XF Points
            </p>
            <p className="text-4xl font-bold text-[#c0f24d] mt-1">
              {wallet.availableBalance.toLocaleString()}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {wallet.lifetimeEarned.toLocaleString()} lifetime pts
            </p>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${tier.color}`}>
              {wallet.tier !== "NONE" ? `${tier.label} Tier` : "No Tier Yet"}
            </span>
            {wallet.tierDiscount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {wallet.tierDiscount}% off at partners
              </p>
            )}
          </div>
        </div>

        {/* Progress to next tier */}
        {tier.next && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{wallet.availableBalance.toLocaleString()} pts</span>
              <span>{tier.next.toLocaleString()} pts</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tier.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(tier.next - wallet.availableBalance).toLocaleString()} pts to
              next tier
            </p>
          </div>
        )}

        {wallet.tier === "GOLD" && (
          <p className="text-xs text-yellow-400 mt-2">🏆 Max tier reached!</p>
        )}
      </div>

      {/* Tier info pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          {
            tier: "BRONZE",
            pts: "500+",
            disc: "10%",
            color: "border-amber-800 text-amber-600",
          },
          {
            tier: "SILVER",
            pts: "1000+",
            disc: "15%",
            color: "border-gray-600 text-gray-300",
          },
          {
            tier: "GOLD",
            pts: "2000+",
            disc: "20%",
            color: "border-yellow-600 text-yellow-400",
          },
        ].map((t) => (
          <div
            key={t.tier}
            className={`flex-1 min-w-[90px] rounded-lg border px-3 py-2 text-center ${t.color} ${
              wallet.tier === t.tier ? "bg-white/5" : ""
            }`}
          >
            <p className="text-xs font-bold">{t.tier}</p>
            <p className="text-xs opacity-70">{t.pts} pts</p>
            <p className="text-sm font-bold">{t.disc} OFF</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-4">
        {[
          ["wallet", "How to Earn"],
          ["history", "Ledger"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-b-2 border-[#c0f24d] text-[#c0f24d]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <span className="text-xl">🎟️</span>
            <div>
              <p className="font-medium text-white">Buy Tickets</p>
              <p className="text-xs text-gray-500">
                Earn 10 XF points per $1 spent on any ticket.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <span className="text-xl">🏷️</span>
            <div>
              <p className="font-medium text-white">Redeem at Partners</p>
              <p className="text-xs text-gray-500">
                Spend points for exclusive discounts at our partner brands.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="font-medium text-white">Show QR / Coupon</p>
              <p className="text-xs text-gray-500">
                In-store: partner scans your QR. Online: use your coupon code.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div>
          {!ledger || ledger.content?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {ledger.content.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm bg-[#1a1a1a] rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isDebitTransaction(tx) && (
                        <img
                          src={XF_DEBIT_LOGO_SRC}
                          alt="Xfrizon debit"
                          title="XF debit"
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-[#c0f24d]/50"
                        />
                      )}
                      <p className="text-white text-xs truncate">{tx.description}</p>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      tx.points > 0 ? "text-[#c0f24d]" : "text-red-400"
                    }`}
                  >
                    {tx.points > 0 ? "+" : ""}
                    {tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
