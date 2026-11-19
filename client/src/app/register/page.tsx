import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const registerPageTitle = 'Register as a Professional';

const CATEGORIES = [
  { key: 'legal', label: 'Lawyer', description: 'Legal services including consultation, documentation, and representation' },
  { key: 'accounting', label: 'Accountant', description: 'Accounting and financial services' },
  { key: 'tax', label: 'Tax Consultant', description: 'Tax planning and compliance services' },
];

export default function RegisterPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSelectedCategory(CATEGORIES[0].key), []);

  const registerProf = async (data: any) => {
    try { await api.register({ ...data, category: selectedCategory }); } catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
  };

  if (error) return <div className="min-h-screen p-8 flex flex-col items-center justify-center"><h1 className="text-2xl font-bold text-[#1B2A4A] mb-4">Error</h1><p className="text-gray-600 mb-6">{error}</p><Link href="/login" className="bg-[#00A6A6] text-white px-6 py-3 rounded-lg">Login</Link></div>;
  if (user) return <div className="min-h-screen flex items-center justify-center">Logged in. <Link href="/dashboard/client">Dashboard</Link></div>;

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-[#1B2A4A] mb-6">Register as Professional</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-[#1B2A4A] mb-4">Professional Profile</h3>
        <p className="text-gray-500 mb-2">Category: {selectedCategory ? CATEGORIES.find(c => c.key === selectedCategory)?.label : 'Select a category'}</p>
        <form onSubmit={(e: any) => { e.preventDefault(); registerProf({ firstName: e.target.firstName.value, lastName: e.target.lastName.value, email: e.target.email.value }); }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input type="text" name="firstName" placeholder="First Name" required className="w-full px-3 py-2 border rounded" />
            <input type="text" name="lastName" placeholder="Last Name" required className="w-full px-3 py-2 border rounded" />
            <input type="email" name="email" placeholder="email@ex.com" required className="w-full px-3 py-2 border rounded" />
          </div>
          <button type="submit" className="w-full px-6 py-3 bg-[#1B2A4A] text-white rounded-lg">Create Account</button>
        </form>
      </div>
      <div className="mt-6 text-sm">
        <p>Select your professional category:</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {CATEGORIES.map((c) => (<div key={c.key} className="border p-2 cursor-pointer {selectedCategory === c.key ? 'bg-[#00A6A6]/10 border-[#00A6A6]' : ''}" onClick={() => setSelectedCategory(c.key)}>{c.label}</div>))}
        </div>
      </div>
    </div>
  );
}