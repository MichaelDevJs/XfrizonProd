/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    "bg-red-600",
    "bg-black",
    "text-white",
    "text-indigo-400",
    "rounded-xl",
    "shadow-lg",
    "p-4",
    "py-10",
    "px-8",
    "mb-6",
    "min-h-screen",
    "flex",
    "items-center",
    "justify-center",
    "overflow-hidden",
    "transition",
    "hover:scale-105",
    // add more as needed
  ],
  theme: {
    extend: {
      colors: {
        xf: {
          accent: "#403838",
        },
      },
    },
  },
  plugins: [],
};
