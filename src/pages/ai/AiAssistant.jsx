import React, { useState } from 'react';
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AiAssistant() {
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your PharmaHub AI Operations Assistant. How can I help optimize your pharmacy today?',
    },
  ]);

  const suggestions = [
    'Forecast sales for next month',
    'Optimize reorder stock levels',
    'Find duplicate SKU medicine entries',
    'Summarize tax liability trends',
  ];

  const handleSend = (textToSend) => {
    const userMessage = textToSend || prompt;
    if (!userMessage.trim()) return;

    setChatLog((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setPrompt('');

    // Fake AI Responses matching request
    setTimeout(() => {
      let response = "I'm processing that optimization task. Can you specify a target branch?";
      if (userMessage.includes('Forecast sales')) {
        response = 'Based on historical POS sales data for Kothrud Central, I forecast a +12.4% surge in demand for antidiabetic medicines next month. I suggest increasing Metformin order quantities by 150 units.';
      } else if (userMessage.includes('reorder')) {
        response = 'I have identified 3 critical low-stock items reaching reorder triggers: Dolo 650mg (15 units remaining), Celin 500mg (-2 units), and Pan 40mg (10 units). I have drafted a Purchase Order for Sun Pharma.';
      } else if (userMessage.includes('duplicate')) {
        response = 'Audit scan complete: Found 1 potential duplicate drug record: "Dolo 650" and "Dolo 650mg Tablet". I suggest merging the stock balances into the master record.';
      } else if (userMessage.includes('tax')) {
        response = 'Net GST tax liability stands at ₹8,150.00. Output GST collected is ₹14,250.00 and Input Tax Credit (ITC) is ₹6,100.00.';
      }

      setChatLog((prev) => [...prev, { sender: 'ai', text: response }]);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Suggestions and Cards */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>PharmaHub AI Assistant</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational machine intelligence for forecasting, anomaly audit checks, and restock levels
          </p>
        </div>

        {/* Suggestion Prompts */}
        <div className="saas-card rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Suggested AI Operations</span>
          </h3>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="w-full text-left p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insight Flags */}
        <div className="saas-card rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>AI Predictive Insights</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Expiry Write-off Risk Warning</p>
                <p className="text-slate-500 mt-0.5">Batch #AMX-99 is at high write-off risk. Discount suggestion: 15% promo code.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-t border-slate-200 dark:border-slate-800 pt-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Procurement Safety Checked</p>
                <p className="text-slate-500 mt-0.5">Supplier rates are within normal threshold parameters (0.5% variance index).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive AI Chat Workspace */}
      <div className="lg:col-span-2 saas-card rounded-2xl flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
        {/* Messages Log */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {chatLog.map((chat, idx) => (
            <div
              key={idx}
              className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                  chat.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-200 dark:border-slate-800'
                }`}
              >
                {chat.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask PharmaHub AI: 'Find inventory anomalies', 'Forecast sales'..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500/40"
            />
            <button
              onClick={() => handleSend()}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
