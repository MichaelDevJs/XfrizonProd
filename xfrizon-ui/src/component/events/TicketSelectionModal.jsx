import { useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function TicketSelectionModal({
  tickets,
  onSelect,
  onClose,
  serviceFeeRate = 0.1,
  currencySymbol = "₦",
}) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const roundCurrency = (amount) =>
    Math.round((Number(amount) + 1e-9) * 100) / 100;

  const handleSelect = () => {
    if (!selectedTier) return;
    onSelect(selectedTier, quantity);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-800 rounded-lg max-w-md w-full border border-zinc-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">Select Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No tickets available
            </p>
          ) : (
            tickets.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTier?.id === tier.id
                    ? "border-red-500 bg-red-500 bg-opacity-10"
                    : "border-zinc-700 hover:border-red-500 hover:bg-zinc-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white text-lg">
                      {tier.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {tier.quantity} available
                    </p>
                  </div>
                  <p className="text-xl font-bold text-red-500">
                    ₦{tier.price.toLocaleString()}
                  </p>
                </div>
                {tier.description && (
                  <p className="text-xs text-gray-400">{tier.description}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Quantity selector */}
        {selectedTier && (
          <div className="px-6 py-4 border-t border-zinc-700">
            <label className="block text-sm text-gray-300 mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded transition-colors font-semibold"
              >
                −
              </button>
              <span className="text-white font-bold text-lg w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(Math.min(selectedTier.quantity, quantity + 1))
                }
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded transition-colors font-semibold"
              >
                +
              </button>
              <span className="text-gray-400 text-sm ml-auto">
                Max: {selectedTier.quantity}
              </span>
            </div>
          </div>
        )}

        {/* Total */}
        {selectedTier && (
          <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-900">
            {(() => {
              const subtotal = roundCurrency(selectedTier.price * quantity);
              const serviceFee = roundCurrency(subtotal * serviceFeeRate);
              const total = roundCurrency(subtotal + serviceFee);

              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="text-white font-semibold">
                      {currencySymbol}
                      {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Service fee (10%):</span>
                    <span className="text-white font-semibold">
                      {currencySymbol}
                      {serviceFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-2xl font-bold text-red-500">
                      {currencySymbol}
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-zinc-700 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedTier}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
