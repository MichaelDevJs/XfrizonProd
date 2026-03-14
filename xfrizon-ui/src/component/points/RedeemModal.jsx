import React, { useState } from "react";
import pointsApi from "../../api/pointsApi";

export default function RedeemModal({ offer, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRedeem = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pointsApi.redeem(offer.id);
      setResult(data);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Redemption failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl leading-none"
        >
          ×
        </button>

        {!result ? (
          <>
            <h2 className="text-white font-bold text-lg mb-1">Redeem Offer</h2>
            <p className="text-gray-400 text-sm mb-5">{offer.partnerName}</p>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-5 border border-gray-700">
              <p className="text-white font-semibold">{offer.title}</p>
              {offer.description && (
                <p className="text-gray-400 text-xs mt-1">
                  {offer.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[#c0f24d] text-2xl font-bold">
                  {offer.discountPercent}% OFF
                </span>
                <span className="text-gray-400 text-sm">
                  🪙 {offer.pointsCost.toLocaleString()} pts
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-lg py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex-1 bg-[#c0f24d] hover:brightness-110 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-all"
              >
                {loading ? "Redeeming..." : "Confirm Redeem"}
              </button>
            </div>
          </>
        ) : (
          <RedemptionResult result={result} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function RedemptionResult({ result, onClose }) {
  const isOnline =
    result.partnerType === "ONLINE" || result.partnerType === "BOTH";
  const isInPerson =
    result.partnerType === "IN_PERSON" || result.partnerType === "BOTH";
  const [copied, setCopied] = useState(false);

  const copyCoupon = () => {
    navigator.clipboard.writeText(result.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-[#c0f24d]/10 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-3xl">✅</span>
      </div>
      <h2 className="text-white font-bold text-lg mb-1">Points Redeemed!</h2>
      <p className="text-gray-400 text-sm mb-5">
        {result.pointsUsed.toLocaleString()} pts deducted ·{" "}
        {result.discountPercent}% off at {result.partnerName}
      </p>

      {isInPerson && result.qrCodeDataUri && (
        <div className="mb-4">
          <p className="text-gray-400 text-xs mb-2">
            Show this QR code in-store:
          </p>
          <img
            src={result.qrCodeDataUri}
            alt="Redemption QR"
            className="w-48 h-48 mx-auto rounded-xl border border-gray-700 bg-white p-1"
          />
          <p className="text-gray-500 text-xs mt-2">
            Valid for 24 hours · one-time use
          </p>
        </div>
      )}

      {isOnline && result.couponCode && (
        <div className="mb-5">
          <p className="text-gray-400 text-xs mb-2">
            Use this coupon code online:
          </p>
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 justify-between">
            <span className="text-[#c0f24d] font-mono font-bold tracking-widest text-lg">
              {result.couponCode}
            </span>
            <button
              onClick={copyCoupon}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-5">
        Expires: {new Date(result.expiresAt).toLocaleString()}
      </div>

      <button
        onClick={onClose}
        className="w-full bg-[#c0f24d] hover:brightness-110 text-black font-bold rounded-lg py-2.5 text-sm transition-all"
      >
        Done
      </button>
    </div>
  );
}
