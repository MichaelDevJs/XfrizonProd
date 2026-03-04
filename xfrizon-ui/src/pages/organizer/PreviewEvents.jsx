import { useLocation } from "react-router-dom";
import React from "react";

const PreviewEvent = () => {
  const { state } = useLocation();
  const { eventData, tickets } = state;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Preview Event</h2>

      <div className="bg-gray-900 p-6 rounded-xl">
        <h3 className="text-xl">{eventData.title}</h3>
        <p>{eventData.venue}</p>
        <p>{eventData.date}</p>

        <h4 className="mt-6 font-semibold">Tickets</h4>
        {tickets.map((t, i) => (
          <div key={i}>
            {t.name} - ${t.price}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewEvent;
