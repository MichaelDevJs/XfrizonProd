import Header from "../component/layout/Header";
import Footer from "../component/layout/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import { useLocation } from "react-router-dom";

function App({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen bg-[#1e1e1e] text-white">
      {!isAdminRoute && <Header />}
      <main className={!isAdminRoute ? "flex-1 pt-12 sm:pt-14" : "flex-1"}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
