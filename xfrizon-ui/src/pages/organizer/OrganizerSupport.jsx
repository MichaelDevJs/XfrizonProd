import React, { useState } from "react";
import { FaHeadset, FaPhone, FaEnvelope, FaPaperPlane } from "react-icons/fa";

const OrganizerSupport = () => {
  const [message, setMessage] = useState("");

  const contactMethods = [
    {
      icon: <FaEnvelope className="w-6 h-6" />,
      title: "Email Support",
      description: "support@xfrizon.com",
      action: "Contact us",
    },
    {
      icon: <FaPhone className="w-6 h-6" />,
      title: "Phone Support",
      description: "+234 (0) 000-0000",
      action: "Call",
    },
    {
      icon: <FaHeadset className="w-6 h-6" />,
      title: "Live Chat",
      description: "Available 9 AM - 8 PM",
      action: "Chat Now",
    },
  ];

  const faqs = [
    {
      q: "How do I create an event?",
      a: "Go to Create Event in the sidebar and fill in all the required information including event details, venue, and ticket tiers.",
    },
    {
      q: "When will I receive payment for ticket sales?",
      a: "Payments are processed weekly to your registered bank account. You can track pending payments in the Finance section.",
    },
    {
      q: "Can I edit an event after publishing?",
      a: "Yes, you can edit event details from the My Events page, but some changes may not be allowed close to the event date.",
    },
    {
      q: "How do I handle refunds?",
      a: "Refund requests can be managed from your messages. Contact our support team for complex refund situations.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-gray-200 mb-2">
          Support & Help
        </h1>
        <p className="text-gray-500 font-light">
          Get help with your organizer account
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactMethods.map((method, idx) => (
          <div
            key={idx}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500 transition-all duration-300 group"
          >
            <div className="text-red-500 mb-3 group-hover:scale-110 transition-transform">
              {method.icon}
            </div>
            <h3 className="text-white font-light mb-1">{method.title}</h3>
            <p className="text-gray-500 font-light text-sm mb-4">
              {method.description}
            </p>
            <button className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-xs w-full transition-all duration-300">
              {method.action}
            </button>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-light text-gray-200 mb-4">
          Send us a Message
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full p-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all font-light text-sm"
          />
          <textarea
            placeholder="Your message..."
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all font-light text-sm resize-none"
          />
          <button className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2">
            <FaPaperPlane className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-2xl font-light text-gray-200 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-red-500 transition-all cursor-pointer group"
            >
              <summary className="font-light text-gray-200 flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-red-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-gray-500 font-light text-sm mt-3">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrganizerSupport;
