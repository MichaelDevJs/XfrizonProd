import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-[#343232] text-gray-300 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-start gap-3">
            <span
              className="text-base font-bold text-red-500 tracking-widest"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              XF
            </span>
          </div>

          <nav className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px] tracking-[0.12em] text-gray-500 text-left">
            <Link
              to="/auth/organizer-signup"
              className="py-1 hover:text-white transition-colors duration-300"
            >
              Organizers
            </Link>
            <Link
              to="/"
              className="py-1 hover:text-white transition-colors duration-300"
            >
              Events
            </Link>
            <Link
              to="/blogs"
              className="py-1 hover:text-white transition-colors duration-300"
            >
              Blogs
            </Link>
            <span className="py-1 text-gray-500">Contact</span>
            <span className="py-1 text-gray-500">About Us</span>
            <span className="py-1 text-gray-500">Partners</span>
            <span className="py-1 text-gray-500">Privacy</span>
            <span className="py-1 text-gray-500">Terms & Conditions</span>
            <span className="py-1 text-gray-500">Documentation</span>
          </nav>

        </div>

        <div className="border-t border-[#343232] my-4" />
        <div className="flex flex-col items-center text-center text-[11px] text-gray-500 font-light mb-2">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-white transition-colors duration-300 mb-1"
            aria-label="Instagram"
          >
            <FaInstagram className="w-4 h-4" />
          </a>
          <div className="leading-5">
            <p>Friedrichshain 17, Berlin Germany</p>
            <p>+4915210422623 xfrizon@gmail.com</p>
          </div>
        </div>
        <div className="text-[11px] text-gray-600 font-light text-center md:text-left">
          © {currentYear} Xfrizon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

