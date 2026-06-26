"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, Meeting, Response } from "@/lib/supabase";
import { calculateRanking } from "@/lib/ranking";
import TimeGrid from "./TimeGrid";
import RankingList from "./RankingList";
import PlaceGallery from "./PlaceGallery";
import { CheckCircle, Copy, Check, Trash2, ArrowLeft } from "lucide-react";

type Props = {
  meeting: Meeting;
};

export default function MeetPage({ meeting }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<Response[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", meeting.id)
      .then(({ data }) => setResponses((data as Response[]) ?? []));
  }, [meeting.id]);

  // 이름 입력 시 기존 응답 자동 로드
  useEffect(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setSelectedSlots([]); setNote(""); return; }
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
  const ranking = calculateRanking(responses, meeting);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting.password) {
      alert("이 약속에는 삭제 비밀번호가 설정되어 있지 않아요.");
      return;
    }
    if (deletePassword !== meeting.password) {
      alert("비밀번호가 틀렸습니다.");
      return;
    }
    setDeleting(true);
    await supabase.from("meetings").delete().eq("id", meeting.id);
    router.push("/");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;

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

    if (error) { alert("저장 오류: " + error.message); return; }

    const { data } = await supabase
      .from("responses")
      .select("*")
      .eq("meeting_id", meeting.id);
    setResponses((data as Response[]) ?? []);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <a
              href="/"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors"
            >
              <ArrowLeft size={13} />
              홈
            </a>
            <div className="flex items-center gap-2">
              <a
                href="/"
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                + 새 약속
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          </div>
          <h1 className="text-base font-bold tracking-tight">{meeting.title}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
              <p className="mt-1.5 text-xs text-gray-400">{selectedSlots.length}개 슬롯 선택됨</p>
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
              {submitting ? "저장 중…" : submitted ? "✓ 완료" : isExistingName ? "응답 수정" : "응답 제출"}
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
              <RankingList slots={ranking.slice(0, 3)} totalParticipants={responses.length} />
            </div>
          </div>
        )}

        {/* 장소 추천 갤러리 */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <PlaceGallery meetingId={meeting.id} />
        </div>

        {/* 약속 삭제 */}
        <div className="pt-4 border-t border-gray-200">
          {!showDelete ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
              약속 삭제
            </button>
          ) : (
            <form onSubmit={handleDelete} className="space-y-2">
              <p className="text-xs text-gray-500 font-semibold">약속 삭제 — 삭제 비밀번호를 입력하세요</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="비밀번호"
                  autoFocus
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  type="submit"
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDelete(false); setDeletePassword(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
