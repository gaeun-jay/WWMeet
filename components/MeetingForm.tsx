"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateTimeOptions } from "@/lib/ranking";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES = ["일","월","화","수","목","금","토"];

export default function MeetingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const timeOptions = generateTimeOptions(0, 24 * 60, 30);

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  function toggleDay(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr].sort()
    );
  }

  function removeDate(d: string) {
    setDates((prev) => prev.filter((x) => x !== d));
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || dates.length === 0 || !password) {
      alert("제목, 날짜, 삭제 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (startTime >= endTime) {
      alert("종료 시각은 시작 시각보다 늦어야 합니다.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("meetings")
      .insert({ title, dates, start_time: startTime, end_time: endTime, step_minutes: 30, participants: [], password: password || null })
      .select("id")
      .single();
    setSubmitting(false);

    if (error || !data) {
      alert("오류: " + error?.message);
      return;
    }

    router.push(`/meet/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          약속 이름
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 7월 정기 약속"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* 후보 날짜 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          후보 날짜
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <ChevronLeft size={14} className="text-gray-600" />
            </button>
            <span className="text-xs font-semibold text-gray-700">
              {calYear}년 {MONTH_NAMES[calMonth]}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <ChevronRight size={14} className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const selected = dates.includes(dateStr);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-7 w-7 mx-auto text-xs rounded-md transition-colors font-medium ${
                    selected ? "bg-black text-white" : "hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {dates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {dates.map((d) => {
              const [, m, day] = d.split("-").map(Number);
              return (
                <span key={d} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                  {m}/{day}
                  <button type="button" onClick={() => removeDate(d)}>
                    <X size={12} className="text-gray-400 hover:text-black" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 시간 범위 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            시작 시각
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {timeOptions.slice(0, -1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            종료 시각
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {timeOptions.slice(1).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 삭제 비밀번호 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          삭제 비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="약속 삭제 시 사용할 비밀번호"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
      >
        {submitting ? "생성 중…" : "약속 만들기 →"}
      </button>
    </form>
  );
}
