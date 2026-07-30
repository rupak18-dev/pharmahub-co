import React, { useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { CATEGORIES } from '../../constants/inventoryData';

export default function Categories() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const cat = {
      name: newCategory.name,
      code: `CAT-${newCategory.name.substring(0, 3).toUpperCase()}`,
      count: 0,
      description: newCategory.description || 'Custom category',
    };
    setCategories((prev) => [cat, ...prev]);
    setNewCategory({ name: '', description: '' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Drug Categories</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize pharmaceutical products by therapeutic category ({categories.length} active)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div key={cat.name} className="saas-card rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                {cat.code}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {cat.count} Medicines
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
