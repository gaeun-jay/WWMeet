"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Place } from "@/lib/supabase";
import { Heart, Plus, X } from "lucide-react";

const LIKED_KEY = "wwmeet_liked_places";

function getStoredLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function setStoredLikes(ids: Set<string>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function detectMapType(url: string): "naver" | "kakao" | "other" {
  const lower = url.toLowerCase();
  if (lower.includes("naver.me") || lower.includes("map.naver.com") || lower.includes("place.naver.com")) return "naver";
  if (lower.includes("kakao.com") || lower.includes("kko.to") || lower.includes("place.map.kakao")) return "kakao";
  return "other";
}

type Props = {
  meetingId: string;
};

export default function PlaceGallery({ meetingId }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPlaces = useCallback(async () => {
    const { data } = await supabase
      .from("places")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("likes_count", { ascending: false });
    setPlaces((data as Place[]) ?? []);
  }, [meetingId]);

  useEffect(() => {
    fetchPlaces();
    setLikedIds(getStoredLikes());
  }, [fetchPlaces]);

  async function handleLike(place: Place) {
    const isLiked = likedIds.has(place.id);
    const newCount = isLiked ? Math.max(0, place.likes_count - 1) : place.likes_count + 1;

    setPlaces((prev) =>
      [...prev.map((p) => p.id === place.id ? { ...p, likes_count: newCount } : p)]
        .sort((a, b) => b.likes_count - a.likes_count)
    );

    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(place.id);
    else newLikedIds.add(place.id);
    setLikedIds(newLikedIds);
    setStoredLikes(newLikedIds);

    await supabase.from("places").update({ likes_count: newCount }).eq("id", place.id);
  }

  function parseShareText(raw: string): { extractedUrl: string; extractedName: string } {
    // URL 추출 (텍스트 어디서든)
    const urlMatch = raw.match(/https?:\/\/[^\s]+/);
    const extractedUrl = urlMatch?.[0] ?? "";

    // 네이버/카카오 공유 형식에서 장소 이름 추출
    // [네이버지도]\n장소이름\n주소\nhttps://...
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    let extractedName = "";
    const headerIdx = lines.findIndex((l) => l.startsWith("[") && l.includes("지도") || l.includes("카카오맵"));
    if (headerIdx !== -1 && lines[headerIdx + 1]) {
      extractedName = lines[headerIdx + 1];
    }

    return { extractedUrl, extractedName };
  }

  function handleUrlChange(raw: string) {
    const { extractedUrl, extractedName } = parseShareText(raw);
    if (extractedUrl) {
      setUrl(extractedUrl);
      if (extractedName && !placeName) setPlaceName(extractedName);
    } else {
      setUrl(raw);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !placeName.trim()) {
      alert("장소 이름과 링크를 모두 입력해주세요.");
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    setSubmitting(true);
    const { error } = await supabase.from("places").insert({
      meeting_id: meetingId,
      submitter_name: "",
      place_name: placeName.trim(),
      url: normalizedUrl,
      image_url: null,
      likes_count: 0,
    });
    setSubmitting(false);

    if (error) {
      alert("저장 실패: " + error.message);
      return;
    }

    setUrl("");
    setPlaceName("");
    setShowForm(false);
    await fetchPlaces();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          장소 추천
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "닫기" : "추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">장소 이름</label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="스타벅스 강남역점"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">네이버맵 / 카카오맵 링크</label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://naver.me/... 또는 공유 텍스트 붙여넣기"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2 rounded-lg text-sm font-semibold"
          >
            {submitting ? "추가 중…" : "장소 추가"}
          </button>
        </form>
      )}

      {places.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          추천 장소가 없어요. 첫 번째로 추가해보세요!
        </p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {places.map((place) => {
            const mapType = detectMapType(place.url);
            const isLiked = likedIds.has(place.id);

            return (
              <div
                key={place.id}
                className="relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
                onClick={() => window.open(place.url, "_blank", "noopener,noreferrer")}
              >
                {/* 썸네일 이미지 */}
                <div className="h-17 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gallery.png"
                    alt={place.place_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="px-1.5 pt-1 pb-1 flex flex-col flex-1">
                  <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">
                    {place.place_name}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-medium ${
                      mapType === "naver" ? "text-green-600" :
                      mapType === "kakao" ? "text-yellow-600" :
                      "text-gray-400"
                    }`}>
                      {mapType === "naver" ? "N" : mapType === "kakao" ? "K" : "📍"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleLike(place); }}
                      className={`flex items-center gap-0.5 text-xs font-semibold transition-colors ${
                        isLiked ? "text-red-500" : "text-gray-300 hover:text-red-400"
                      }`}
                    >
                      <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
                      <span>{place.likes_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
