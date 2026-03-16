import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import partnersApi from "../../api/partnersApi";
import { useAuth } from "../../hooks/useAuth";

const INDUSTRIES = [
  "FOOD",
  "HAIR_SALON",
  "FASHION",
  "BEAUTY",
  "FITNESS",
  "ENTERTAINMENT",
  "OTHER",
];
const TYPES = ["ONLINE", "IN_PERSON", "BOTH"];

export default function PartnerRegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    brandLogo: "",
    industry: "FOOD",
    type: "IN_PERSON",
    website: "",
    location: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    loginPassword: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!user) {
        if (!form.contactEmail) {
          setError("Contact email is required.");
          return;
        }
        if (!form.loginPassword) {
          setError("Password is required.");
          return;
        }
      }

      const res = await partnersApi.register(form);

      if (!user) {
        await login(form.contactEmail, form.loginPassword);
        navigate("/partner-dashboard", { replace: true });
        return;
      }

      setMessage(
        res?.message || "Registration submitted. You can now browse the partner area.",
      );

      setForm((prev) => ({
        ...prev,
        name: "",
        description: "",
        brandLogo: "",
        website: "",
        location: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        loginPassword: "",
      }));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not submit partner registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-gray-400 hover:text-white mb-4"
        >
          Back
        </button>
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Become a Xfrizon Partner</h1>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Register your brand. After approval, your profile appears publicly
            and users can redeem points with you.
          </p>
          <p className="text-xs text-[#c0f24d] mb-4">
            Use your account password. If no user account exists yet, this partner signup will create it.
          </p>

          <form
            onSubmit={submit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Brand Name" required>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="input"
              />
            </Field>

            <Field label="Industry" required>
              <select
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className="input"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Partner Type" required>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="input"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Brand Logo URL">
              <input
                value={form.brandLogo}
                onChange={(e) => update("brandLogo", e.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>

            <Field label="Website">
              <input
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Field>

            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="input"
                placeholder="City / Branch"
              />
            </Field>

            <Field label="Address" className="md:col-span-2">
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="input"
                placeholder="Street, district, city"
              />
            </Field>

            <Field label="Contact Email" required={!user} className="md:col-span-1">
              <input
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                className="input"
                type="email"
                required={!user}
              />
            </Field>

            <Field label="Contact Phone" className="md:col-span-1">
              <input
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Password" required={!user} className="md:col-span-2">
              <input
                value={form.loginPassword}
                onChange={(e) => update("loginPassword", e.target.value)}
                className="input"
                type="password"
                required={!user}
                placeholder={!user ? "Your account password" : "Optional"}
              />
            </Field>

            <Field label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                className="input"
                placeholder="Tell us about your brand"
              />
            </Field>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#c0f24d] text-black px-5 py-2.5 rounded-lg font-semibold text-sm hover:brightness-110 disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : !user
                    ? "Submit & Login"
                    : "Submit Registration"}
              </button>
              {message && <p className="text-xs text-green-400">{message}</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </form>
        </div>
      </div>

      <style>{`.input{width:100%;background:#0d0d0d;border:1px solid #3f3f46;border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.875rem;color:white}`}</style>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-400 mb-1">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}

