import React from 'react';
import { Award, Gift, Star, ShieldCheck } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '../../constants/customerData';

export default function LoyaltyProgram() {
  const totalPoints = INITIAL_CUSTOMERS.reduce((acc, c) => acc + c.loyaltyPoints, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          <span>Patient Loyalty & Rewards Program</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Reward repeat patients with points on purchases, tiers, and instant discount vouchers
        </p>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { tier: 'Bronze Member', minPts: '0 - 100 pts', discount: '2% Cash Reward', color: 'border-amber-700/30 bg-amber-700/5' },
          { tier: 'Silver Member', minPts: '101 - 300 pts', discount: '5% Cash Reward', color: 'border-slate-400/30 bg-slate-400/5' },
          { tier: 'Gold Member', minPts: '301 - 750 pts', discount: '8% Cash Reward', color: 'border-amber-400/30 bg-amber-400/5' },
          { tier: 'Platinum Member', minPts: '750+ pts', discount: '12% Cash Reward', color: 'border-purple-500/30 bg-purple-500/5' },
        ].map((t) => (
          <div key={t.tier} className={`saas-card rounded-2xl p-4 space-y-2 border ${t.color}`}>
            <span className="text-[10px] font-bold text-amber-500 uppercase">{t.minPts}</span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t.tier}</h3>
            <p className="text-xs font-bold text-emerald-500">{t.discount}</p>
          </div>
        ))}
      </div>

      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Member Point Standings</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 font-sans">Patient Name</th>
              <th className="py-2.5 px-3 font-sans">Membership Tier</th>
              <th className="py-2.5 px-3">Available Points</th>
              <th className="py-2.5 px-3">Redeemed Points</th>
              <th className="py-2.5 px-3 font-sans text-right">Reward Voucher Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {INITIAL_CUSTOMERS.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{c.name}</td>
                <td className="py-2.5 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {c.membershipTier}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-amber-500">{c.loyaltyPoints} pts</td>
                <td className="py-2.5 px-3 text-slate-400">150 pts</td>
                <td className="py-2.5 px-3 font-sans text-right">
                  <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm">
                    Issue Discount Coupon
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
