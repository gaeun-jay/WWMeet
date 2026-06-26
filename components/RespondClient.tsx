"use client";

import { useState, useEffect } from "react";
import { supabase, Meeting, Response } from "@/lib/supabase";
import { calculateRanking } from "@/lib/ranking";
import TimeGrid from "./TimeGrid";
import RankingList from "./RankingList";
import MeetingForm from "./MeetingForm";
import PlaceGallery from "./PlaceGallery";
import { CheckCircle, ChevronDown, Plus, X } from "lucide-react";

type Props = {
  meetings: Meeting[];
};

export default function RespondClient({ meetings: initialMeetings }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [nameInput, setNameInput] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const meeting = meetings.find((m) => m.id === selectedMeetingId);

  useEffect(() => {
    if (!selectedMeetingId) {
      setResponses([]);
      setNameInput("");
      setSelectedSlots([]);
      setNote("");
      setSubmitted(false);
      return;
    }

    supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", selectedMeetingId)
      .then(({ data }) => {
        setResponses((data as Response[]) ?? []);
      });

    setNameInput("");
    setSelectedSlots([]);
    setNote("");
    setSubmitted(false);
  }, [selectedMeetingId]);

  // 이름 입력 시 기존 응답 자동 로드
  useEffect(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setSelectedSlots([]);
      setNote("");
      return;
    }
    const existing = responses.find((r) => r.name === trimmed);
    if (existing) {
      setSelectedSlots(existing.available_slots);
      setNote(existing.note ?? "");
    } else {
      setSelectedSlots([]);
      setNote("");
    }
    setSubmitted(false);
  }, [nameInput, responses]);

  const respondedNames = responses.map((r) => r.name);
  const isExistingName = respondedNames.includes(nameInput.trim());
  const ranking = meeting ? calculateRanking(responses, meeting) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting || !nameInput.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("responses").upsert(
      {
        meeting_id: meeting.id,
        name: nameInput.trim(),
        available_slots: selectedSlots,
        note: note || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "meeting_id,name" }
    );
    setSubmitting(false);

    if (error) {
      alert("저장 중 오류가 발생했습니다: " + error.message);
      return;
    }

    const { data } = await supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", meeting.id);
    setResponses((data as Response[]) ?? []);
    setSubmitted(true);
  }

  async function handleMeetingCreated() {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("created_at", { ascending: false });
    setMeetings((data as Meeting[]) ?? []);
    setShowCreateForm(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold tracking-tight">약속 잡기</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 새 약속 만들기 */}
        <div>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
          >
            {showCreateForm ? <X size={15} /> : <Plus size={15} />}
            새 약속 만들기
          </button>
          {showCreateForm && (
            <div className="mt-3">
              <MeetingForm onCreated={handleMeetingCreated} />
            </div>
          )}
        </div>

        {/* 약속 선택 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            약속 선택
          </label>
          <div className="relative">
            <select
              value={selectedMeetingId}
              onChange={(e) => setSelectedMeetingId(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">약속을 선택하세요</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {meeting && (
          <>
            {/* 일정 응답 폼 */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이름 입력 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />

                {/* 기존 참가자 빠른 선택 */}
                {respondedNames.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1.5">이미 참가한 친구:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {respondedNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setNameInput(name)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            nameInput.trim() === name
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isExistingName && (
                  <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-500" />
                    기존 응답을 불러왔어요. 수정 후 제출하면 업데이트됩니다.
                  </p>
                )}
              </div>

              {/* 시간 그리드 */}
              {nameInput.trim() && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    가능한 일정{" "}
                    <span className="font-normal text-gray-400 lowercase">(클릭/드래그)</span>
                  </label>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-3">
                    <TimeGrid
                      dates={meeting.dates}
                      startTime={meeting.start_time}
                      endTime={meeting.end_time}
                      stepMinutes={meeting.step_minutes}
                      selectedSlots={selectedSlots}
                      onChange={setSelectedSlots}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {selectedSlots.length}개 슬롯 선택됨
                  </p>
                </div>
              )}

              {/* 메모 */}
              {nameInput.trim() && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    메모{" "}
                    <span className="font-normal text-gray-400 lowercase">(선택)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="예: 오후 6시 이후만 가능"
                    rows={2}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              )}

              {/* 제출 버튼 */}
              {nameInput.trim() && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
                >
                  {submitting
                    ? "저장 중…"
                    : submitted
                    ? "✓ 완료"
                    : isExistingName
                    ? "응답 수정"
                    : "응답 제출"}
                </button>
              )}
            </form>

            {/* 응답 현황 */}
            {responses.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  응답 현황 ({responses.length}명 응답)
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-2">
                  <RankingList
                    slots={ranking}
                    totalParticipants={responses.length}
                  />
                </div>
              </div>
            )}

            {/* 장소 추천 갤러리 */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
              <PlaceGallery meetingId={meeting.id} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
