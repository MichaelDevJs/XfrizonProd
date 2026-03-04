import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const OrganizerRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/organizers/register", form);
    navigate("/organizer/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl w-96">
        <h2 className="text-2xl font-bold mb-6">Organizer Register</h2>

        <input
          placeholder="Name"
          className="input"
          onChange={(e) => setForm({...form, name: e.target.value})}
        />

        <input
          placeholder="Email"
          className="input mt-3"
          onChange={(e) => setForm({...form, email: e.target.value})}
        />

        <input
          type="password"
          placeholder="Password"
          className="input mt-3"
          onChange={(e) => setForm({...form, password: e.target.value})}
        />

        <textarea
          placeholder="Bio"
          className="input mt-3"
          onChange={(e) => setForm({...form, bio: e.target.value})}
        />

        <button className="btn-primary mt-4 w-full">
          Register
        </button>
      </form>
    </div>
  );
};

export default OrganizerRegister;