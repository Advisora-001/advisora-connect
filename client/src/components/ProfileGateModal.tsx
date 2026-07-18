'use client';

import Link from 'next/link';

interface ProfileGateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileGateModal({
  open,
  onClose,
}: ProfileGateModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          🔒
        </div>
        <h3 className="text-xl font-bold text-accent mb-2">Sign up or log in</h3>
        <p className="text-gray-600 mb-6">
          You need an account to view lawyer profiles. Create one or log in to continue.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 font-bold transition-all"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="w-full border-2 border-primary text-accent px-6 py-3 rounded-lg hover:bg-primary/10 font-semibold transition-all"
          >
            Log In
          </Link>
        </div>
        <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
          Maybe later
        </button>
      </div>
    </div>
  );
}