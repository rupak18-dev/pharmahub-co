import React, { useState } from 'react';
import { MessageSquare, Send, Mail, Smartphone, History } from 'lucide-react';
import { COMMUNICATION_LOGS } from '../../constants/customerData';

export default function CommunicationCenter() {
  const [channel, setChannel] = useState('WhatsApp'); // 'WhatsApp' | 'SMS' | 'Email'
  const [recipient, setRecipient] = useState('+91 98201 12345 (Ramesh Sharma)');
  const [message, setMessage] = useState('Dear Patient, your prescribed medicine refill is ready for pickup.');
  const [logs, setLogs] = useState(COMMUNICATION_LOGS);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const newLog = {
      id: `COM-${Math.floor(900 + Math.random() * 900)}`,
      customerName: recipient.split(' ')[2] || 'Selected Patient',
      channel,
      message,
      timestamp: new Date().toLocaleString(),
      status: 'Sent',
    };
    setLogs((prev) => [newLog, ...prev]);
    setMessage('');
    alert(`${channel} message queued and delivered!`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Patient Communication Center</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Broadcast SMS, WhatsApp messages, and automated email alerts to patients
        </p>
      </div>

      {/* Multi-Channel Composer */}
      <div className="saas-card rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
          Broadcast Message Composer
        </h3>

        <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Select Channel *</label>
              <div className="flex items-center gap-2">
                {['WhatsApp', 'SMS', 'Email'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all border ${
                      channel === ch
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-1">Select Patient Recipient *</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Message Body *</label>
            <textarea
              rows="3"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Message</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Log */}
      <div className="saas-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Communication History Log</h3>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 font-sans">Message ID</th>
              <th className="py-2.5 px-3 font-sans">Patient</th>
              <th className="py-2.5 px-3 font-sans">Channel</th>
              <th className="py-2.5 px-3 font-sans">Message Snippet</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3 font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="py-2.5 px-3 font-bold text-blue-600">{log.id}</td>
                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{log.customerName}</td>
                <td className="py-2.5 px-3 font-sans font-semibold text-slate-700 dark:text-slate-300">{log.channel}</td>
                <td className="py-2.5 px-3 font-sans text-slate-500 max-w-xs truncate">{log.message}</td>
                <td className="py-2.5 px-3 text-slate-400">{log.timestamp}</td>
                <td className="py-2.5 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
