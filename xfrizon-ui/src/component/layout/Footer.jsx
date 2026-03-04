import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
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

          <nav className="flex flex-wrap gap-5 text-xs uppercase tracking-widest text-gray-500">
            <Link
              to="/"
              className="hover:text-white transition-colors duration-300"
            >
              Events
            </Link>
            <Link
              to="/artists"
              className="hover:text-white transition-colors duration-300"
            >
              Artists
            </Link>
            <Link
              to="/auth/organizer-signup"
              className="hover:text-white transition-colors duration-300"
            >
              Organizers
            </Link>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              Contact
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              Terms
            </a>
          </nav>

          <div className="flex items-center gap-4 text-gray-500">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              <FaTwitter className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              <FaFacebook className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="border-t border-zinc-900 my-6" />

        <div className="text-xs text-gray-600 font-light">
          © {currentYear} Xfrizon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
