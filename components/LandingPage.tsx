"use client";

import { useState } from "react";
import MeetingForm from "./MeetingForm";
import { Plus, X } from "lucide-react";

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold tracking-tight">WWMeet</h1>
          <p className="text-xs text-gray-400">When Where Meet</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <p className="text-sm text-gray-500">
          약속을 만들면 공유 링크가 생성돼요.<br />
          친구들에게 링크를 보내면 각자 가능한 날짜를 고르고 장소를 추천할 수 있어요.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              새 약속 만들기
            </span>
          </button>

          {showForm && (
            <div className="border-t border-gray-100 p-5">
              <MeetingForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
