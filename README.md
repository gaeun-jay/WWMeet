# WWMeet — When Where Meet

친구들과 약속 잡을 때 가능한 일정을 한 번에 수집하고, 장소도 함께 추천할 수 있는 미니 웹 서비스입니다.

## 주요 기능

| 기능 | 설명 |
|---|---|
| 약속 생성 | 제목, 후보 날짜, 시간대, 삭제 비밀번호 설정 후 공유 링크 생성 |
| 일정 입력 | when2meet 스타일 그리드, 클릭/드래그로 가능 시간 선택 (PC + 모바일) |
| 응답 수정 | 기존 참가자 이름 선택 시 응답 자동 로드 후 수정 가능 |
| 랭킹 결과 | 가능 인원 수 기준 상위 3개 시간대 표시 |
| 장소 추천 | 네이버맵·카카오맵 링크 등록, 좋아요순 갤러리 뷰 |
| 약속 삭제 | 생성 시 설정한 비밀번호로 삭제 |

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + REST API) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Deploy | Vercel |

## 프로젝트 구조

```
WWMeet/
├── app/
│   ├── meet/[id]/
│   │   └── page.tsx          # 약속 상세 페이지 (동적 라우트)
│   ├── admin/
│   │   └── page.tsx          # / 로 리디렉트
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # 홈 (약속 만들기)
├── components/
│   ├── LandingPage.tsx       # 홈 화면
│   ├── MeetPage.tsx          # 약속 상세 클라이언트 컴포넌트
│   ├── MeetingForm.tsx       # 약속 생성 폼
│   ├── PlaceGallery.tsx      # 장소 추천 갤러리
│   ├── RankingList.tsx       # 가능 시간 랭킹 리스트
│   └── TimeGrid.tsx          # 드래그 시간 선택 그리드
├── lib/
│   ├── ranking.ts            # 랭킹 계산 로직
│   └── supabase.ts           # Supabase 클라이언트 & 타입
├── supabase_schema.sql       # DB 스키마 (테이블 + RLS 정책)
├── supabase_grant.sql        # anon 역할 권한 부여
└── .env.example
```

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 설정

[Supabase](https://supabase.com)에서 새 프로젝트 생성 후 SQL Editor에서 순서대로 실행합니다.

```
1. supabase_schema.sql
2. supabase_grant.sql
```

### 3. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase 프로젝트 URL과 anon key를 입력합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

## 사용 흐름

1. 홈에서 **새 약속 만들기** → 이름, 날짜, 시간대, 삭제 비밀번호 입력
2. 생성 후 자동으로 약속 페이지(`/meet/[id]`)로 이동
3. **링크 복사** 버튼으로 친구들에게 공유
4. 각자 이름 입력 후 가능한 시간 드래그 선택
5. 장소 추천 갤러리에서 원하는 장소 링크 추가 및 좋아요
