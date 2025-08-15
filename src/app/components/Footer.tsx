

import { FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <>
      <div className="flex justify-center gap-6 py-4 text-white">
        <a
          href="https://www.instagram.com/gods_coffee_call/"
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-yellow-400 transition-colors duration-200"
        >
          <FaInstagram size={28} />
        </a>
        <a
          href="https://www.youtube.com/@GodsCoffeeCall24"
          aria-label="YouTube"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-yellow-400 transition-colors duration-200"
        >
          <FaYoutube size={28} />
        </a>
        <a
          href="https://www.tiktok.com/@godscoffeecall?_t=ZT-8yqhLUuPZJl&_r=1"
          aria-label="TikTok"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-yellow-400 transition-colors duration-200"
        >
          <FaTiktok size={28} />
        </a>
      </div>
      <footer className="bg-black text-gray-500 py-8 text-center text-sm">
        © 2025 AVAILABLE Conference • Designed by <a href="https://www.ruachstudio.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
          Ruach Studios
        </a>
      </footer>
    </>
  );
}