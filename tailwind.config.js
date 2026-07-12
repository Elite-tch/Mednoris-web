/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#34254e",
        "brand-secondary": "#573d82",
        "brand-accent": "#8c6a9f"
      },
      fontFamily: {
        serif: ["Merriweather", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};
