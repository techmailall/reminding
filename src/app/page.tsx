'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Calendar, Upload } from 'lucide-react';
import type { Reminder } from '@/types';
import {
  fetchReminders,
  deleteReminder,
  subscribeToReminders,
} from '@/lib/supabase/client';
import ReminderForm from '@/components/ReminderForm';
import ReminderList from '@/components/ReminderList';
import BulkImport from '@/components/BulkImport';

export default function ReminderDashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // ============================================
  // Data Fetching
  // ============================================

  const loadReminders = useCallback(async () => {
    try {
      const data = await fetchReminders();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();

    const sub = subscribeToReminders(loadReminders);

    return () => {
      sub.unsubscribe();
    };
  }, [loadReminders]);

  // ============================================
  // Actions
  // ============================================

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await deleteReminder(id);
      loadReminders();
    } catch {
      alert('Failed to delete reminder');
    }
  };

  const handleTriggerImmediate = async (reminder: Reminder) => {
    try {
      const response = await fetch('/api/trigger-immediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_id: reminder.id }),
      });

      if (!response.ok) throw new Error('Trigger failed');
      alert('Reminder triggered successfully!');
    } catch {
      alert('Failed to trigger reminder');
    }
  };

  const handleBulkImport = async (csvData: string, template: string) => {
    const response = await fetch('/api/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData, defaultTemplate: template }),
    });

    if (!response.ok) throw new Error('Import failed');

    setShowBulkImport(false);
    loadReminders();
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Automated Reminder & Wish System
          </h1>
          <p className="text-slate-400 mt-2">
            Schedule and automate personalized notifications
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Gift className="w-6 h-6 text-pink-400" />
                {showBulkImport ? 'Bulk Import' : 'Create New Reminder'}
              </h2>
              <button
                type="button"
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {showBulkImport ? 'Single Entry' : 'Bulk Import'}
              </button>
            </div>

            {showBulkImport ? (
              <BulkImport
                onImport={handleBulkImport}
                onCancel={() => setShowBulkImport(false)}
              />
            ) : (
              <ReminderForm onSuccess={loadReminders} />
            )}
          </section>

          <section className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 max-h-[800px] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Active Reminders ({reminders.length})
            </h2>
            <ReminderList
              reminders={reminders}
              onDelete={handleDelete}
              onTrigger={handleTriggerImmediate}
              isLoading={loading}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
