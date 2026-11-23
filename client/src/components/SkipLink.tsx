"use client";

/**
 * Skip to Main Content Link
 * Accessibility requirement: WCAG 2.1 SC 2.4.1 Bypass Blocks
 * Allows keyboard users to skip repetitive navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        absolute -top-10 left-4 z-50
        bg-[#1B2A4A] text-white
        px-4 py-2 rounded-lg
        font-semibold text-sm
        transition-all duration-200
        focus:top-4 focus:outline-none focus:ring-2 focus:ring-[#00A6A6] focus:ring-offset-2
        hover:bg-[#16213A]
      "
    >
      Skip to main content
    </a>
  );
}