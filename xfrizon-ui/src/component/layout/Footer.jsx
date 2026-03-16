import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span
              className="text-lg font-bold text-red-500 tracking-widest"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              XF
            </span>
            <span className="text-xs text-gray-500 tracking-widest font-light">
              EVENTS
            </span>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-3 md:flex md:flex-wrap md:gap-5 text-xs uppercase tracking-widest text-gray-500 text-center md:text-left">
            <Link
              to="/"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Events
            </Link>
            <Link
              to="/partners"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Partners
            </Link>
            <Link
              to="/partner-register"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Become Partner
            </Link>
            <Link
              to="/partner-scanner"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Partner Scanner
            </Link>
            <Link
              to="/artists"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Artists
            </Link>
            <Link
              to="/auth/organizer-signup"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Organizers
            </Link>
            <a
              href="#"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Contact
            </a>
            <a
              href="#"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Privacy
            </a>
            <a
              href="#"
              className="py-1.5 hover:text-white transition-colors duration-300"
            >
              Terms
            </a>
          </nav>

          <div className="flex items-center justify-center md:justify-end gap-3 text-gray-500">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-700 transition-colors duration-300"
            >
              <FaTwitter className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-700 transition-colors duration-300"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-700 transition-colors duration-300"
            >
              <FaFacebook className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-700 transition-colors duration-300"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="border-t border-zinc-900 my-6" />

                <div className="mb-6 p-3 rounded-lg border border-zinc-800/70 bg-zinc-950/40">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-2">
            Partner Flow
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link to="/partner-register" className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
              1. Register Brand
            </Link>
            <Link to="/partners" className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
              2. Public Profile
            </Link>
            <Link to="/partner-scanner" className="px-2.5 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
              3. Scan & Apply Discount
            </Link>
          </div>
        </div>
        <div className="text-xs text-gray-600 font-light text-center md:text-left">
          © {currentYear} Xfrizon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

