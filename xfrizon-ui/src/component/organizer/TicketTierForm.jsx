import { useState } from "react";

const TicketTierForm = ({ tickets, setTickets }) => {
  const [tier, setTier] = useState({
    type: "",
    quantity: "",
    price: "",
    salesEndDate: "",
  });

  const addTier = () => {
    setTickets([...tickets, tier]);
    setTier({ type: "", quantity: "", price: "", salesEndDate: "" });
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl space-y-4">
      <h3 className="text-xl font-bold">Ticket Tiers</h3>

      <input
        placeholder="Ticket Type (Early Bird, VIP...)"
        className="input"
        value={tier.type}
        onChange={(e) => setTier({ ...tier, type: e.target.value })}
      />

      <input
        placeholder="Quantity"
        className="input"
        value={tier.quantity}
        onChange={(e) => setTier({ ...tier, quantity: e.target.value })}
      />

      <input
        placeholder="Price"
        className="input"
        value={tier.price}
        onChange={(e) => setTier({ ...tier, price: e.target.value })}
      />

      <input
        type="date"
        className="input"
        value={tier.salesEndDate}
        onChange={(e) => setTier({ ...tier, salesEndDate: e.target.value })}
      />

      <button
        type="button"
        onClick={addTier}
        className="bg-green-600 px-4 py-2 rounded"
      >
        Add Ticket Tier
      </button>

      {/* Preview */}
      {tickets.map((t, i) => (
        <div key={i} className="bg-gray-800 p-3 rounded">
          {t.type} - ${t.price}
        </div>
      ))}
    </div>
  );
};

export default TicketTierForm;
