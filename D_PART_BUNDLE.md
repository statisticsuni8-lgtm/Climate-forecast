# weather-briefing · 전체 소스 번들 (D 파트 포함 프로젝트 뼈대)

> 이 한 파일에 프로젝트의 모든 소스가 경로별로 담겨 있습니다.
> GitHub에 올려 다른 파트(A·B·C)와 합칠 때, 각 파일을 아래 경로 그대로 만들면 됩니다.
> (node_modules, .next, .env.local 등은 제외 — 각자 로컬에서 `npm install` 후 사용)

## 폴더 구조
```
weather-briefing/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── login/page.tsx
│   ├── onboarding/region/page.tsx
│   ├── onboarding/time/page.tsx
│   ├── home/page.tsx
│   └── api/
│       ├── weather/route.ts
│       └── briefing/route.ts
├── components/
│   ├── WeatherBackground.tsx
│   ├── AIBriefingCard.tsx
│   ├── HourlyForecastStrip.tsx
│   └── BottomTabBar.tsx
├── lib/
│   ├── supabase.ts
│   ├── weather.ts
│   ├── regionGrid.ts
│   ├── gemini.ts
│   └── session.ts
├── supabase/
│   ├── schema.sql
│   └── functions/daily-briefing/index.ts
├── package.json / tsconfig.json / next.config.mjs
├── tailwind.config.ts / postcss.config.js
├── .gitignore / .env.example / README.md
```

---

## `package.json`

```json
{
  "name": "weather-briefing",
  "version": "0.1.0",
  "private": true,
  "description": "매일 아침 날씨를 분석해 '오늘 뭘 챙길지' 한 문장으로 알려주는 모바일 웹앱",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.5.3"
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "supabase/functions"]
}
```

## `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
// Next.js 14 (App Router) 기본 설정. 특별한 커스터마이징 없음(공통기반 고정 스택 준수).
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

## `postcss.config.js`

```js
// Tailwind CSS 사용을 위한 PostCSS 설정 (공통기반 스택 준수)
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

// 공통기반 6번 디자인 규칙: 모바일 우선(최대폭 480px), 날씨별 5가지 sky_theme 배경색.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // 콘텐츠 최대 폭: 모바일 기준 480px
      maxWidth: {
        app: "480px",
      },
      // 날씨별 배경 테마 색 (sky_theme 5종) — WeatherBackground에서 사용
      colors: {
        sky: {
          clear: "#7FB8E8", // 맑음
          cloudy: "#93AEC4", // 구름 조금
          overcast: "#8B95A0", // 흐림
          rain: "#55657A", // 비
          snow: "#A9B4C2", // 눈
        },
      },
      fontFamily: {
        // Pretendard 권장, 없으면 시스템 sans-serif로 폴백
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
```

## `.gitignore`

```
# dependencies
/node_modules
/.pnp
.pnp.js

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files (환경변수는 각자 로컬에만 — 절대 커밋 금지)
.env
.env.local
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts

# vercel
.vercel
```

## `.env.example`

```
# 공통기반 4번 환경변수 템플릿 (커밋 가능). 팀원은 이 파일을 .env.local 로 복사 후 값 채우기.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
KMA_API_KEY=
GEMINI_API_KEY=
```

## `README.md`

```markdown
# weather-briefing

매일 아침, 사용자가 설정한 지역의 날씨를 분석해 **"오늘 뭘 챙길지"** 한 문장(AI·Gemini)으로 알려주는 모바일 웹앱입니다. 날씨를 보여주는 앱이 아니라, **대신 판단해주는** 앱입니다. 푸시를 지워도 홈에서 오늘의 조언을 다시 볼 수 있습니다.

> 이 저장소는 **공통기반(00) 문서**의 폴더 구조·DB·환경변수·디자인 규칙을 그대로 따르는 뼈대입니다. 외부 API/DB 키가 없어도 **mock 기본값으로 바로 동작**합니다.

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 키는 나중에 채워도 됨(없으면 mock 동작)
npm run dev                  # http://localhost:3000
```

흐름: `/` → (미로그인) `/login` → `/onboarding/region` → `/onboarding/time` → `/home`

## 환경변수 (.env.local)

| 키 | 용도 | 없을 때 |
|----|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 클라이언트 | mock 세션(localStorage)으로 동작 |
| `SUPABASE_SERVICE_ROLE_KEY` | 스케줄러(서버) | Edge Function 미동작 |
| `KMA_API_KEY` | 기상청 단기예보 | `MOCK_WEATHER`로 응답 |
| `GEMINI_API_KEY` | 문구 생성 | fallback 템플릿 문구 사용 |

## 담당(파트)별 파일

| 파트 | 파일 |
|------|------|
| **A** (DB·인증·지역) | `lib/supabase.ts`, `lib/regionGrid.ts`, `lib/session.ts`(임시), `supabase/schema.sql`, 로그인/온보딩 로직 |
| **B** (날씨) | `lib/weather.ts`(3축 판정), `app/api/weather/route.ts` |
| **C** (AI·스케줄러) | `lib/gemini.ts`, `app/api/briefing/route.ts`, `supabase/functions/daily-briefing/` |
| **D** (화면) | `app/layout.tsx`, 각 `page.tsx`, `components/*` |

## 핵심 설계 (요약)

- **3축 독립 판정**: 강수(PTY) / 기온(TMX·TMN) / 습도·바람(REH·WSD) → `lib/weather.ts`
- **배경은 심플하게**: PTY+SKY로 `sky_theme` 5종만 → `components/WeatherBackground.tsx`
- **결측치**: 값 ≥900 또는 ≤−900 → 해당 축 판정 제외
- **AI 실패 시 fallback** 템플릿으로 대체(앱 안 멈춤)
- **비용 절감**: Gemini는 지역당 1회, 이름은 `{name}` 자리표시자로 두고 발송 시 치환

## MVP 범위

온보딩 3화면 + 홈 + 아침 문구 생성·발송. (알림기록·설정·에러 화면, 정식 인증, 전국 지역 확장은 2차)
```

## `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * 공통 전역 스타일 (D 담당)
 * - 모바일 우선: body를 화면 중앙 정렬, 콘텐츠 최대폭 480px는 레이아웃에서 제어.
 * - 날씨가 곧 배경이 되는 감성(iOS 날씨 앱 오마주)을 위해 body 기본 배경은 투명하게 두고
 *   WeatherBackground 컴포넌트가 화면 전체 배경을 담당.
 */

:root {
  color-scheme: light;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100dvh;
}

body {
  font-family: var(--font-sans, "Pretendard", -apple-system, BlinkMacSystemFont,
      system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  color: #0f172a;
}

/* 배경 위 콘텐츠 가독성을 위한 공통 유틸 */
.text-shadow-soft {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* 구름 이동 애니메이션 (WeatherBackground에서 사용) */
@keyframes drift {
  from {
    transform: translateX(-10%);
  }
  to {
    transform: translateX(110%);
  }
}

/* 빗방울/눈 낙하 애니메이션 */
@keyframes fall {
  from {
    transform: translateY(-10%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  to {
    transform: translateY(110vh);
    opacity: 0.2;
  }
}

/* 눈송이 좌우 흔들림 (fall과 함께 부모/자식으로 합성) */
@keyframes sway {
  from {
    transform: translateX(-6px);
  }
  to {
    transform: translateX(6px);
  }
}

/* 해의 은은한 맥동 (clear 테마) */
@keyframes sun-pulse {
  0%,
  100% {
    opacity: 0.85;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}
```

## `app/layout.tsx`

```tsx
/**
 * app/layout.tsx — 공통 레이아웃 (담당 D)
 *
 * 공통기반 6번: 모바일 우선. 콘텐츠 최대폭 480px(max-w-app)로 중앙 정렬.
 * 데스크톱에서는 은은한 배경 위에 '폰 화면'처럼 가운데 정렬되어 보인다.
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 뭐 챙기지",
  description:
    "매일 아침, 오늘 뭘 챙길지 한 문장으로 알려주는 날씨 브리핑 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7FB8E8", // 기본 clear 테마 색
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-300">
        {/* 폰 화면처럼 480px로 가운데 정렬. 배경(WeatherBackground)은 각 페이지가 채운다. */}
        <div className="mx-auto min-h-[100dvh] w-full max-w-app">{children}</div>
      </body>
    </html>
  );
}
```

## `app/page.tsx`

```tsx
"use client";

/**
 * app/page.tsx — 진입점 → 로그인/온보딩 여부에 따라 분기 (담당 D)
 *
 * - 로그인 안 됨          → /login
 * - 로그인했지만 온보딩 미완료 → /onboarding/region
 * - 온보딩 완료           → /home
 *
 * (정식 인증 전까지는 lib/session의 mock 세션으로 판단)
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, isLoggedIn } from "@/lib/session";

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!isLoggedIn(s)) {
      router.replace("/login");
    } else if (!s.onboarded) {
      router.replace("/onboarding/region");
    } else {
      router.replace("/home");
    }
  }, [router]);

  // 분기 판단 중 잠깐 보이는 로딩 화면 (clear 테마 톤)
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-sky-clear text-white">
      <p className="text-sm opacity-80">불러오는 중…</p>
    </div>
  );
}
```

## `app/login/page.tsx`

```tsx
"use client";

/**
 * app/login/page.tsx — 화면1 로그인 (담당 A + D)
 *
 * 공통기반 6번: 로그인 시점엔 지역을 몰라 날씨를 알 수 없음 → 배경은 기본 테마(clear) 고정.
 * 정식 인증은 2차 범위. MVP는 이름/전화 입력으로 mock 세션을 만들어 온보딩으로 진행.
 * (담당 A가 이후 Supabase Auth(전화 OTP 등)로 교체)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 시작하기: mock 세션(user_id 포함) 저장 후 지역 선택으로
  // (정식 인증 전까지 user_id는 클라이언트에서 생성. A가 Supabase Auth로 교체 시 대체)
  const handleStart = () => {
    if (!name.trim()) return;
    const userId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `mock-${Date.now()}`;
    saveSession({
      userId,
      name: name.trim(),
      phone: phone.trim(),
      onboarded: false,
    });
    router.push("/onboarding/region");
  };

  return (
    // 로그인은 clear 테마 고정 (아직 날씨를 모름)
    <div className="flex min-h-[100dvh] flex-col justify-between bg-sky-clear px-6 py-10 text-white">
      <header className="mt-10">
        <h1 className="text-shadow-soft text-3xl font-bold leading-tight">
          좋은 아침이에요 ☀️
        </h1>
        <p className="mt-3 text-white/85">
          매일 아침, 오늘 뭘 챙길지
          <br />한 문장으로 알려드릴게요.
        </p>
      </header>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-white/85">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 나화진"
            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-md focus:border-white/60"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/85">전화번호(선택)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="010-0000-0000"
            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-md focus:border-white/60"
          />
        </label>

        <button
          type="button"
          onClick={handleStart}
          disabled={!name.trim()}
          className="mt-2 w-full rounded-2xl bg-white py-3.5 font-semibold text-sky-clear shadow-lg transition active:scale-[0.99] disabled:opacity-50"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
```

## `app/onboarding/region/page.tsx`

```tsx
"use client";

/**
 * app/onboarding/region/page.tsx — 화면2 지역 선택 (담당 A + D)
 *
 * 공통기반 regions 시드(REGIONS)에서 하나 선택 → 세션에 regionId 저장 → 알림 시간 화면으로.
 * MVP는 5개 지역만(전국 확장 2차). 배경은 아직 날씨를 모르니 clear 고정.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGIONS } from "@/lib/regionGrid";
import { saveSession } from "@/lib/session";

export default function RegionPage() {
  const router = useRouter();
  const [regionId, setRegionId] = useState<number | null>(null);

  const handleNext = () => {
    if (regionId == null) return;
    saveSession({ regionId });
    router.push("/onboarding/time");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-sky-clear px-6 py-10 text-white">
      <header className="mb-6">
        <p className="text-sm text-white/80">1 / 2</p>
        <h1 className="text-shadow-soft mt-1 text-2xl font-bold">
          어느 지역의 날씨를
          <br />알려드릴까요?
        </h1>
      </header>

      {/* 지역 목록 */}
      <ul className="flex-1 space-y-2">
        {REGIONS.map((r) => {
          const selected = r.region_id === regionId;
          return (
            <li key={r.region_id}>
              <button
                type="button"
                onClick={() => setRegionId(r.region_id)}
                aria-pressed={selected}
                className={[
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left backdrop-blur-md transition",
                  selected
                    ? "border border-white bg-white/30 font-semibold"
                    : "border border-white/30 bg-white/15",
                ].join(" ")}
              >
                <span>{r.region_name}</span>
                {selected && <span aria-hidden>✓</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleNext}
        disabled={regionId == null}
        className="mt-4 w-full rounded-2xl bg-white py-3.5 font-semibold text-sky-clear shadow-lg transition active:scale-[0.99] disabled:opacity-50"
      >
        다음
      </button>
    </div>
  );
}
```

## `app/onboarding/time/page.tsx`

```tsx
"use client";

/**
 * app/onboarding/time/page.tsx — 화면3 알림 시간 (담당 A + D)
 *
 * 매일 아침 몇 시에 브리핑을 받을지 + 요일 선택 → 세션 저장 + 온보딩 완료 → 홈으로.
 * (user_settings 테이블의 push_time / weekdays 와 동일 개념. 실제 저장은 A가 Supabase로 연결)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

// 0=일 ~ 6=토
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function TimePage() {
  const router = useRouter();
  const [pushTime, setPushTime] = useState("07:00");
  // 기본값: 평일(월~금)
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleDay = (d: number) => {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  };

  const handleFinish = () => {
    saveSession({ pushTime, weekdays, onboarded: true });
    router.push("/home");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-sky-clear px-6 py-10 text-white">
      <header className="mb-6">
        <p className="text-sm text-white/80">2 / 2</p>
        <h1 className="text-shadow-soft mt-1 text-2xl font-bold">
          아침 몇 시에
          <br />알려드릴까요?
        </h1>
      </header>

      <div className="flex-1 space-y-6">
        {/* 시간 선택 */}
        <label className="block">
          <span className="mb-2 block text-sm text-white/85">알림 시간</span>
          <input
            type="time"
            value={pushTime}
            onChange={(e) => setPushTime(e.target.value)}
            className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-lg text-white outline-none backdrop-blur-md focus:border-white/60"
          />
        </label>

        {/* 요일 선택 */}
        <div>
          <span className="mb-2 block text-sm text-white/85">받을 요일</span>
          <div className="flex justify-between">
            {WEEKDAY_LABELS.map((label, d) => {
              const on = weekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className={[
                    "h-11 w-11 rounded-full text-sm backdrop-blur-md transition",
                    on
                      ? "bg-white font-semibold text-sky-clear"
                      : "border border-white/30 bg-white/15 text-white",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFinish}
        className="mt-4 w-full rounded-2xl bg-white py-3.5 font-semibold text-sky-clear shadow-lg transition active:scale-[0.99]"
      >
        시작하기
      </button>
    </div>
  );
}
```

## `app/home/page.tsx`

```tsx
"use client";

/**
 * app/home/page.tsx — 화면4 홈·브리핑 (담당 D, 데이터는 A·B·C)
 *
 * 이 앱의 핵심 화면. 화면 명세 [5] 구현.
 *  - localStorage user_id 확인(없으면 /login).
 *  - 데이터: 지역(favorite_locations⨝regions) → 날씨(/api/weather?nx=&ny=) → 오늘 문구(push_logs 우선, 없으면 /api/briefing).
 *  - "푸시를 지워도 홈에서 오늘 문구를 다시 본다"(핵심 가치): push_logs 오늘자 조회.
 *  - 상태: loading(스켈레톤) / loaded / error(마지막 저장분 + 안내).
 *  - 당겨서 새로고침(pull to refresh).
 *  - API·DB가 없어도 각 단계 mock 폴백으로 화면이 먼저 보인다.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WeatherBackground from "@/components/WeatherBackground";
import AIBriefingCard from "@/components/AIBriefingCard";
import HourlyForecastStrip, {
  type HourItem,
} from "@/components/HourlyForecastStrip";
import BottomTabBar from "@/components/BottomTabBar";
import { getSession } from "@/lib/session";
import { getRegionById } from "@/lib/regionGrid";
import { getSupabaseClient } from "@/lib/supabase";
import { insertName } from "@/lib/gemini";
import type { SkyTheme } from "@/lib/weather";

// sky_theme → 헤더에 보여줄 한국어 날씨 상태 라벨
const SKY_LABEL: Record<SkyTheme, string> = {
  clear: "맑음",
  cloudy: "구름 조금",
  overcast: "흐림",
  rain: "비",
  snow: "눈",
};

interface HomeData {
  regionName: string;
  tmp: number | null;
  skyTheme: SkyTheme;
  skyLabel: string;
  message: string; // 이름 치환 완료된 최종 문장
  hours: HourItem[];
}

type Status = "loading" | "loaded" | "error";

const HOME_CACHE_KEY = "wb_home_cache"; // error 시 "마지막 저장분" 표시용

// 오늘 날짜 YYYY-MM-DD (로컬)
function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<HomeData | null>(null);

  // 당겨서 새로고침 상태
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  /**
   * 홈 데이터 로드: 지역 → 날씨 → 오늘 문구.
   * 각 단계는 실패해도 mock으로 폴백하고, 전체 실패 시에만 error 처리.
   */
  const load = useCallback(async () => {
    const session = getSession();
    const userId = session.userId;
    // 사용자 없음 → 로그인으로
    if (!userId) {
      router.replace("/login");
      return;
    }

    const supabase = getSupabaseClient();

    try {
      // ── 1) 지역 + 좌표 ─────────────────────────────
      // 기본값: 세션의 regionId(온보딩 선택) → 시드 좌표. (Supabase 없어도 동작)
      const fallbackRegion = getRegionById(session.regionId ?? 1)!;
      let region = {
        region_id: fallbackRegion.region_id,
        region_name: fallbackRegion.region_name,
        nx: fallbackRegion.nx,
        ny: fallbackRegion.ny,
      };

      if (supabase) {
        // favorite_locations ⨝ regions 에서 사용자의 대표 지역 조회
        const { data: fav } = await supabase
          .from("favorite_locations")
          .select("region_id, regions(region_name, nx, ny)")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (fav) {
          // 조인 결과(regions)는 객체/배열 어느 쪽이든 대응
          const r = Array.isArray((fav as any).regions)
            ? (fav as any).regions[0]
            : (fav as any).regions;
          if (r) {
            region = {
              region_id: (fav as any).region_id,
              region_name: r.region_name,
              nx: r.nx,
              ny: r.ny,
            };
          }
        }
      }

      // ── 2) 오늘 날씨 (B의 API) ─────────────────────
      const wRes = await fetch(
        `/api/weather?nx=${region.nx}&ny=${region.ny}&region_id=${region.region_id}`
      );
      const weather = await wRes.json();
      const skyTheme: SkyTheme =
        (weather?.axes?.sky_theme as SkyTheme) ?? "clear";
      const tmp: number | null = weather?.summary?.tmp ?? null;
      const hours: HourItem[] = weather?.hours ?? [];

      // ── 3) 오늘 문구 (C: push_logs 우선 → 없으면 /api/briefing) ──
      let message = "";
      if (supabase) {
        const { data: pushRow } = await supabase
          .from("push_logs")
          .select("message")
          .eq("user_id", userId)
          .eq("date", todayStr())
          .maybeSingle();
        // push_logs의 message는 발송 시 이미 이름이 치환된 최종 문장
        if (pushRow?.message) message = pushRow.message as string;
      }

      if (!message) {
        // 오늘자 발송 기록이 없으면 즉석 생성 ({name} 자리표시자 포함)
        const bRes = await fetch(
          `/api/briefing?region_id=${region.region_id}`
        );
        const brief = await bRes.json();
        message = insertName(
          brief?.message ?? "{name}님, 좋은 아침이에요 🙂",
          session.name ?? ""
        );
      }

      const next: HomeData = {
        regionName: region.region_name,
        tmp,
        skyTheme,
        skyLabel: SKY_LABEL[skyTheme],
        message,
        hours,
      };

      setData(next);
      setStatus("loaded");
      // 마지막 정상 로드분 캐시 (error 시 재사용)
      try {
        window.localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(next));
      } catch {
        /* 저장 실패는 무시 */
      }
    } catch {
      // 전체 실패 → 마지막 저장분이 있으면 그걸 보여주고 안내
      try {
        const cached = window.localStorage.getItem(HOME_CACHE_KEY);
        if (cached) setData(JSON.parse(cached) as HomeData);
      } catch {
        /* 무시 */
      }
      setStatus("error");
    }
  }, [router]);

  // 최초 로드
  useEffect(() => {
    void load();
  }, [load]);

  // 당겨서 새로고침 실행
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    setPull(0);
  }, [load]);

  // ── 터치 핸들러(당겨서 새로고침) ─────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    // 스크롤이 최상단일 때만 pull 시작
    if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
    else startY.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 70)); // 저항감 있게
  };
  const onTouchEnd = () => {
    if (startY.current == null) return;
    if (pull > 50) void doRefresh();
    else setPull(0);
    startY.current = null;
  };

  const theme: SkyTheme = data?.skyTheme ?? "clear";
  const isLoading = status === "loading";

  return (
    <WeatherBackground skyTheme={theme}>
      <main
        className="flex min-h-[100dvh] flex-col gap-4 px-5 pb-24 pt-12"
        style={{ transform: `translateY(${pull}px)`, transition: pull ? "none" : "transform 0.25s" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 당겨서 새로고침 인디케이터 */}
        {(pull > 0 || refreshing) && (
          <div
            className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-white/80"
            aria-live="polite"
          >
            {refreshing ? "새로고침 중…" : pull > 50 ? "놓으면 새로고침" : "당겨서 새로고침"}
          </div>
        )}

        {/* error 배너: 마지막 저장분을 보여주되 안내 문구 표시 */}
        {status === "error" && (
          <div
            role="alert"
            className="rounded-2xl bg-black/25 px-4 py-2 text-center text-sm text-white backdrop-blur-md"
          >
            최신 정보를 못 불러왔어요. 마지막으로 저장된 내용을 보여드릴게요.
          </div>
        )}

        {/* LocationHeader: 지역명 · 현재기온 · 날씨상태 */}
        <header className="text-center text-white">
          <p className="text-shadow-soft text-lg font-medium">
            {isLoading ? "…" : data?.regionName ?? "내 지역"}
          </p>
          <p className="text-shadow-soft text-6xl font-light leading-tight">
            {data?.tmp != null ? `${data.tmp}°` : "–"}
          </p>
          <p className="text-shadow-soft text-sm text-white/85">
            {isLoading ? " " : data?.skyLabel ?? ""}
          </p>
        </header>

        {/* 핵심: 오늘의 추천 카드 (푸시 지워도 여기서 재확인) */}
        <AIBriefingCard
          message={data?.message ?? ""}
          loading={isLoading && !data}
        />

        {/* 보조: 시간대별 예보 */}
        <HourlyForecastStrip hours={data?.hours} />
      </main>

      {/* 하단 탭 (홈만 활성) */}
      <BottomTabBar active="home" />
    </WeatherBackground>
  );
}
```

## `app/api/weather/route.ts`

```ts
/**
 * app/api/weather/route.ts — 기상청 단기예보 호출 래퍼 (담당 B)
 *
 * 화면(D) 계약: GET /api/weather?nx=..&ny=..   (좌표 기반)
 * 편의 계약:    GET /api/weather?region_id=1   (regions 시드로 좌표 해석)
 *   → 오늘 날씨 요약(WeatherSummary) + 3축 판정(AxisResult) + 시간대별 예보 반환.
 *
 * ⚠️ 지금은 KMA_API_KEY가 없으면(또는 실 연동 전) MOCK_WEATHER로 응답한다.
 *    실제 기상청 getVilageFcst 파싱과 hours 구성은 B가 이 파일에 채운다.
 */

import { NextResponse } from "next/server";
import { getRegionById, REGIONS } from "@/lib/regionGrid";
import { judgeAxes, MOCK_WEATHER, type WeatherSummary } from "@/lib/weather";

const KMA_API_KEY = process.env.KMA_API_KEY;
const isKmaReady = !!KMA_API_KEY && !KMA_API_KEY.startsWith("여기에_");

// mock 시간대별 예보 (화면 HourlyForecastStrip과 동일 형식)
const MOCK_HOURS = [
  { time: "지금", icon: "☀️", temp: 26 },
  { time: "09시", icon: "☀️", temp: 28 },
  { time: "10시", icon: "🌤️", temp: 29 },
  { time: "11시", icon: "🌤️", temp: 30 },
  { time: "12시", icon: "☁️", temp: 30 },
  { time: "13시", icon: "🌦️", temp: 29 },
  { time: "14시", icon: "🌧️", temp: 28 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 좌표 우선. 없으면 region_id로 해석.
  let nx = Number(searchParams.get("nx"));
  let ny = Number(searchParams.get("ny"));
  const regionIdParam = searchParams.get("region_id");

  let regionName: string | null = null;

  if (!Number.isFinite(nx) || !Number.isFinite(ny) || (!nx && !ny)) {
    const region = getRegionById(Number(regionIdParam ?? "1"));
    if (!region) {
      return NextResponse.json(
        { error: "nx,ny 또는 유효한 region_id가 필요합니다." },
        { status: 400 }
      );
    }
    nx = region.nx;
    ny = region.ny;
    regionName = region.region_name;
  } else {
    // 좌표로 들어온 경우, 시드에서 이름을 역참조(있으면)
    regionName =
      REGIONS.find((r) => r.nx === nx && r.ny === ny)?.region_name ?? null;
  }

  // TODO(B): isKmaReady === true 이면 기상청 getVilageFcst(nx, ny) 호출 → parse
  //   const items = await fetchKma(nx, ny);
  //   const summary = parseKmaItems(items);
  //   const hours   = buildHours(items);
  const summary: WeatherSummary = MOCK_WEATHER;
  const source: "kma" | "mock" = isKmaReady ? "mock" : "mock"; // 연동 완료 시 "kma"

  const axes = judgeAxes(summary);

  return NextResponse.json({
    source, // "kma" | "mock" — 프런트 개발 상태 확인용
    coord: { nx, ny },
    region_name: regionName,
    summary,
    axes,
    hours: MOCK_HOURS,
  });
}
```

## `app/api/briefing/route.ts`

```ts
/**
 * app/api/briefing/route.ts — Gemini 오늘의 조언 문구 생성 (담당 C)
 *
 * GET  /api/briefing?region_id=1
 *   → 해당 지역 날씨를 3축 판정하고 Gemini(실패 시 fallback)로 한 문장 생성.
 *
 * 반환 문구에는 이름 자리표시자 {name} 이 포함된다(공통기반 원칙 6, 비용 절감).
 * 실제 발송/홈 표시 시 insertName()으로 사용자 이름을 채운다.
 */

import { NextResponse } from "next/server";
import { getRegionById } from "@/lib/regionGrid";
import { judgeAxes, MOCK_WEATHER } from "@/lib/weather";
import { generateBriefing } from "@/lib/gemini";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const regionId = Number(searchParams.get("region_id") ?? "1");
  const region = getRegionById(regionId);

  if (!region) {
    return NextResponse.json({ error: "unknown region_id" }, { status: 400 });
  }

  // TODO(B·C 연결): weather API/DB에서 실제 요약을 가져오기. 지금은 mock으로 판정.
  const axes = judgeAxes(MOCK_WEATHER);

  // Gemini 호출(1회) — 실패해도 fallback 문구가 돌아온다.
  const message = await generateBriefing(axes, {
    regionName: region.region_name,
  });

  return NextResponse.json({
    region: { region_id: region.region_id, region_name: region.region_name },
    axes,
    message, // 예: "{name}님, 우산 꼭 챙기세요 🙂"
  });
}
```

## `components/WeatherBackground.tsx`

```tsx
/**
 * components/WeatherBackground.tsx — 날씨별 배경 테마 (담당 D)
 *
 * 공통기반 6번 + 화면 명세 [1]: 애플 iOS 날씨 앱 오마주.
 * "날씨가 곧 배경" — 전체화면 배경색 + 가벼운 애니메이션 위에 children을 올린다.
 *
 * skyTheme 5종별 연출 (CSS transform/opacity만 사용, 과하지 않게):
 *   clear    하늘색 #7FB8E8 · 해가 은은히 맥동
 *   cloudy   회청  #93AEC4 · 구름 1~2개 천천히 떠다님
 *   overcast 회색  #8B95A0 · 구름 여러 개
 *   rain     어두운청회 #55657A · 빗방울 은은히 떨어짐
 *   snow     밝은회청 #A9B4C2 · 눈송이 내림(좌우 흔들림)
 */

import type { SkyTheme } from "@/lib/weather";
import type { ReactNode } from "react";

// sky_theme → 배경 그라데이션(위→아래). 상단은 밝게, 하단은 짙게.
const THEME_GRADIENT: Record<SkyTheme, string> = {
  clear: "linear-gradient(180deg, #8FC4F0 0%, #7FB8E8 100%)",
  cloudy: "linear-gradient(180deg, #A6BED2 0%, #93AEC4 100%)",
  overcast: "linear-gradient(180deg, #9AA4AF 0%, #8B95A0 100%)",
  rain: "linear-gradient(180deg, #64748C 0%, #55657A 100%)",
  snow: "linear-gradient(180deg, #C2CCD8 0%, #A9B4C2 100%)",
};

interface Props {
  skyTheme: SkyTheme;
  children?: ReactNode;
}

/** 화면 전체 배경 + 테마별 애니메이션 레이어 + 콘텐츠 */
export default function WeatherBackground({ skyTheme, children }: Props) {
  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: THEME_GRADIENT[skyTheme] }}
    >
      {/* 데코 레이어 (스크린리더 무시) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {skyTheme === "clear" && <Sun />}
        {skyTheme === "cloudy" && <Clouds count={2} />}
        {skyTheme === "overcast" && <Clouds count={4} />}
        {skyTheme === "rain" && (
          <>
            <Clouds count={3} dim />
            <Precip kind="rain" />
          </>
        )}
        {skyTheme === "snow" && <Precip kind="snow" />}
      </div>

      {/* 실제 콘텐츠 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** 해: 우상단에서 은은하게 맥동 */
function Sun() {
  return (
    <div
      className="absolute right-8 top-16 h-28 w-28 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(255,247,214,0.95) 0%, rgba(255,236,160,0.55) 45%, rgba(255,236,160,0) 70%)",
        animation: "sun-pulse 6s ease-in-out infinite",
      }}
    />
  );
}

/** 구름: count개를 서로 다른 속도/위치로 천천히 흐르게 */
function Clouds({ count, dim = false }: { count: number; dim?: boolean }) {
  // 위치·크기·속도를 개수만큼 분산 (index로 결정 → 렌더 안정적)
  const clouds = Array.from({ length: count }).map((_, i) => ({
    top: 40 + i * 46, // px
    scale: 1 - (i % 3) * 0.15,
    duration: 55 + (i % 4) * 15, // s
    opacity: (dim ? 0.18 : 0.28) - (i % 3) * 0.03,
  }));

  return (
    <>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute left-0 rounded-full bg-white blur-2xl"
          style={{
            top: `${c.top}px`,
            width: `${160 * c.scale}px`,
            height: `${70 * c.scale}px`,
            opacity: c.opacity,
            animation: `drift ${c.duration}s linear ${i * -8}s infinite`,
          }}
        />
      ))}
    </>
  );
}

/** 빗방울/눈송이 낙하 입자 (성능 위해 소량) */
function Precip({ kind }: { kind: "rain" | "snow" }) {
  const count = kind === "rain" ? 22 : 16;
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => {
        const left = (i / count) * 100 + (i % 3); // 살짝 흩뿌리기
        const delay = (i % 6) * 0.4;
        const fallDur = kind === "rain" ? 0.9 + (i % 4) * 0.15 : 5 + (i % 5);

        if (kind === "rain") {
          return (
            <span
              key={i}
              className="absolute top-0 h-4 w-[2px] bg-white/40"
              style={{
                left: `${left}%`,
                animation: `fall ${fallDur}s linear ${delay}s infinite`,
              }}
            />
          );
        }

        // 눈: fall(부모)로 낙하 + sway(자식)로 좌우 흔들림 합성
        return (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${left}%`,
              animation: `fall ${fallDur}s linear ${delay}s infinite`,
            }}
          >
            <span
              className="block h-2 w-2 rounded-full bg-white/80"
              style={{
                animation: `sway ${2 + (i % 3)}s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          </span>
        );
      })}
    </>
  );
}
```

## `components/AIBriefingCard.tsx`

```tsx
/**
 * components/AIBriefingCard.tsx — 오늘의 추천 카드 (담당 D) ← 이 앱의 핵심
 *
 * 화면 명세 [2]:
 *  - props: message(string), loading(boolean)
 *  - 반투명 흰 카드에 "오늘의 추천" 라벨 + AI 문장.
 *  - 사용자가 푸시를 지워도 이 카드로 오늘 조언을 다시 볼 수 있음(핵심 가치).
 *  - loading이면 스켈레톤.
 *
 * message는 이미 최종 문장(이름 치환 완료)이 들어온다고 가정한다.
 * (홈에서 {name} 자리표시자를 치환해 전달 — 카드는 표시만 담당)
 */

interface Props {
  message: string;
  loading: boolean;
}

export default function AIBriefingCard({ message, loading }: Props) {
  // 혹시 남아있을 {name} 자리표시자는 방어적으로 제거
  const text = message.replace(/\{name\}님?,?\s*/g, "").trim();

  return (
    <section
      className="rounded-3xl bg-white/20 p-5 shadow-lg backdrop-blur-md"
      aria-label="오늘의 추천"
      aria-busy={loading}
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/80">
        오늘의 추천
      </p>

      {loading ? (
        // 스켈레톤: 두 줄 정도의 자리표시
        <div className="space-y-2" aria-hidden>
          <div className="h-6 w-4/5 animate-pulse rounded-full bg-white/30" />
          <div className="h-6 w-3/5 animate-pulse rounded-full bg-white/25" />
        </div>
      ) : (
        <p className="text-shadow-soft text-2xl font-semibold leading-snug text-white">
          {text}
        </p>
      )}
    </section>
  );
}
```

## `components/HourlyForecastStrip.tsx`

```tsx
/**
 * components/HourlyForecastStrip.tsx — 시간대별 예보 스트립 (담당 D)
 *
 * 화면 명세 [3]: props hours(배열: {time, icon, temp}). 가로 스크롤.
 * 실데이터는 B의 /api/weather 시간대별 예보로 채운다. 없으면 mock으로 UI 먼저.
 */

export interface HourItem {
  time: string; // "지금" / "08시" ...
  icon: string; // 이모지 아이콘 (임시)
  temp: number; // 기온(℃)
}

// mock 시간대별 데이터 (여름 아침 가정)
const MOCK_HOURS: HourItem[] = [
  { time: "지금", icon: "☀️", temp: 26 },
  { time: "09시", icon: "☀️", temp: 28 },
  { time: "10시", icon: "🌤️", temp: 29 },
  { time: "11시", icon: "🌤️", temp: 30 },
  { time: "12시", icon: "☁️", temp: 30 },
  { time: "13시", icon: "🌦️", temp: 29 },
  { time: "14시", icon: "🌧️", temp: 28 },
];

interface Props {
  hours?: HourItem[];
}

export default function HourlyForecastStrip({ hours = MOCK_HOURS }: Props) {
  return (
    <section
      className="rounded-3xl bg-white/15 p-4 backdrop-blur-md"
      aria-label="시간대별 예보"
    >
      <ul className="flex gap-4 overflow-x-auto pb-1">
        {hours.map((h, i) => (
          <li
            key={i}
            className="flex min-w-[52px] flex-col items-center gap-1 text-white"
          >
            <span className="text-xs text-white/80">{h.time}</span>
            {/* 이모지는 장식 → 스크린리더에는 온도/시간 텍스트로 전달 */}
            <span className="text-xl" role="img" aria-label={`${h.time} 날씨`}>
              {h.icon}
            </span>
            <span className="text-sm font-medium">{h.temp}°</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

## `components/BottomTabBar.tsx`

```tsx
/**
 * components/BottomTabBar.tsx — 하단 탭 바 (담당 D)
 *
 * 화면 명세 [4]: 홈/알림기록/설정 3탭. MVP는 '홈'만 활성,
 * 나머지(알림기록·설정)는 2차 범위라 비활성 회색으로 자리만 잡아둔다.
 */

interface Props {
  active?: "home" | "history" | "settings";
}

const TABS = [
  { key: "home", label: "홈", icon: "🏠", enabled: true },
  { key: "history", label: "알림기록", icon: "🔔", enabled: false }, // 2차
  { key: "settings", label: "설정", icon: "⚙️", enabled: false }, // 2차
] as const;

export default function BottomTabBar({ active = "home" }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-app justify-around border-t border-white/20 bg-black/20 px-4 py-2 backdrop-blur-md"
      aria-label="하단 탭 메뉴"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            disabled={!tab.enabled}
            aria-label={
              tab.enabled ? tab.label : `${tab.label} (준비 중)`
            }
            aria-current={isActive ? "page" : undefined}
            aria-disabled={!tab.enabled}
            className={[
              "flex flex-col items-center gap-0.5 text-xs transition",
              tab.enabled ? "text-white" : "cursor-not-allowed text-white/40",
              isActive ? "font-semibold" : "font-normal",
            ].join(" ")}
          >
            <span className="text-lg" aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
```

## `lib/supabase.ts`

```ts
/**
 * lib/supabase.ts — Supabase 클라이언트 (담당 A)
 *
 * 공통기반 4번 환경변수 사용. 키가 아직 없으면 null 클라이언트를 반환해
 * 앱이 mock 데이터로 계속 동작하도록 한다(1일차 개발용).
 *
 *  - 브라우저(클라이언트 컴포넌트)용: getSupabaseClient() → anon key
 *  - 서버(Edge Function/스케줄러)용: getSupabaseAdmin() → service role key
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 환경변수가 실제 값으로 채워졌는지(플레이스홀더 제외) */
function isConfigured(value?: string): value is string {
  return !!value && !value.startsWith("여기에_");
}

/** Supabase 연동 준비 여부 — 화면/로직에서 mock 분기용으로 사용 */
export const isSupabaseReady = isConfigured(url) && isConfigured(anonKey);

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트.
 * 환경변수가 없으면 null → 호출부는 mock 데이터로 폴백할 것.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isConfigured(url) || !isConfigured(anonKey)) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

/**
 * 서버(스케줄러/Edge Function)용 관리자 클라이언트.
 * service role key는 절대 클라이언트 번들에 노출 금지 — 서버 코드에서만 호출.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isConfigured(url) || !isConfigured(serviceKey)) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
```

## `lib/weather.ts`

```ts
/**
 * lib/weather.ts — 기상청 파싱 + 날씨 3축 판정 (담당 B)
 *
 * 공통기반 5번 규칙 구현:
 *  - 날씨를 하나의 유형으로 뭉치지 않고 "강수 / 기온 / 습도·바람" 3축을 독립 판정.
 *  - 배경 테마(sky_theme)는 강수(PTY)+하늘상태(SKY)로 5종만 별도 결정.
 *  - 결측치: 값이 900 이상 또는 -900 이하이면 결측 → 해당 축 판정 제외.
 *
 * ⚠️ 실제 기상청 API 파싱(fetchWeather)은 app/api/weather/route.ts(B)에서 이 함수들을 사용.
 *    지금은 mock 기본값(MOCK_WEATHER)으로 UI·로직이 먼저 동작하도록 함.
 */

// ── 축별 판정값 타입 ─────────────────────────────────────────
export type RainAxis = "none" | "rain" | "snow" | "sleet" | "shower";
export type TempAxis = "normal" | "hot" | "cold" | "swing";
export type HumidAxis = "normal" | "humid" | "windy";
export type SkyTheme = "clear" | "cloudy" | "overcast" | "rain" | "snow";

/** 기상청 원본에서 추려낸 오늘의 관측/예보 요약값 */
export interface WeatherSummary {
  pty: number | null; // 강수형태 코드
  sky: number | null; // 하늘상태 코드 (1맑음/3구름많음/4흐림)
  tmx: number | null; // 일 최고기온
  tmn: number | null; // 일 최저기온
  reh: number | null; // 습도(%)
  wsd: number | null; // 풍속(m/s)
  tmp: number | null; // 현재(대표) 기온 — 홈 표시용
}

/** 3축 판정 결과 + 배경 테마 (weather_logs 저장 형태와 동일) */
export interface AxisResult {
  rain_axis: RainAxis;
  temp_axis: TempAxis | null; // 판정 불가(결측) 시 null
  humid_axis: HumidAxis | null;
  sky_theme: SkyTheme;
}

// ── 결측치 판정 ──────────────────────────────────────────────
/** 기상청 값이 결측(900 이상 또는 -900 이하)인지 확인 */
export function isMissing(v: number | null | undefined): boolean {
  return v == null || Number.isNaN(v) || v >= 900 || v <= -900;
}

// ── 강수축 (PTY) ─────────────────────────────────────────────
// 기상청 PTY 코드: 0 없음 / 1 비 / 2 비·눈 / 3 눈 / 4 소나기
export function judgeRainAxis(pty: number | null): RainAxis {
  if (isMissing(pty)) return "none"; // 결측이면 안전하게 '없음' 취급
  switch (pty) {
    case 1:
      return "rain";
    case 2:
      return "sleet"; // 비/눈
    case 3:
      return "snow";
    case 4:
      return "shower"; // 소나기
    default:
      return "none";
  }
}

// ── 기온축 (TMX, TMN) ────────────────────────────────────────
// hot: TMX≥28 / cold: TMN≤5 / swing: (TMX−TMN)≥10 / 그 외 normal
export function judgeTempAxis(
  tmx: number | null,
  tmn: number | null
): TempAxis | null {
  const hasMax = !isMissing(tmx);
  const hasMin = !isMissing(tmn);
  if (!hasMax && !hasMin) return null; // 둘 다 결측 → 판정 제외

  if (hasMax && (tmx as number) >= 28) return "hot";
  if (hasMin && (tmn as number) <= 5) return "cold";
  if (hasMax && hasMin && (tmx as number) - (tmn as number) >= 10) return "swing";
  return "normal";
}

// ── 습도·바람축 (REH, WSD) ───────────────────────────────────
// humid: REH≥80 / windy: WSD≥9 / 그 외 normal
export function judgeHumidAxis(
  reh: number | null,
  wsd: number | null
): HumidAxis | null {
  const hasReh = !isMissing(reh);
  const hasWsd = !isMissing(wsd);
  if (!hasReh && !hasWsd) return null; // 둘 다 결측 → 판정 제외

  if (hasReh && (reh as number) >= 80) return "humid";
  if (hasWsd && (wsd as number) >= 9) return "windy";
  return "normal";
}

// ── 배경 테마 (sky_theme) ────────────────────────────────────
// "판정은 정밀하게, 배경은 심플하게" — PTY+SKY로 5종만 결정.
export function judgeSkyTheme(pty: number | null, sky: number | null): SkyTheme {
  const rain = judgeRainAxis(pty);
  if (rain === "snow") return "snow";
  if (rain === "rain" || rain === "sleet" || rain === "shower") return "rain";

  // 강수 없음 → 하늘상태로 (1맑음 / 3구름많음 / 4흐림)
  if (isMissing(sky)) return "clear";
  if (sky === 4) return "overcast";
  if (sky === 3) return "cloudy";
  return "clear";
}

/** 요약값 → 3축 판정 + 배경 테마 한 번에 계산 */
export function judgeAxes(w: WeatherSummary): AxisResult {
  return {
    rain_axis: judgeRainAxis(w.pty),
    temp_axis: judgeTempAxis(w.tmx, w.tmn),
    humid_axis: judgeHumidAxis(w.reh, w.wsd),
    sky_theme: judgeSkyTheme(w.pty, w.sky),
  };
}

// ── Mock 기본값 ──────────────────────────────────────────────
// 외부 API 없이 개발할 때 사용. (맑고 더운 여름 아침 가정 — 페르소나 나화진의 출근길)
export const MOCK_WEATHER: WeatherSummary = {
  pty: 0,
  sky: 1,
  tmx: 30,
  tmn: 22,
  reh: 82,
  wsd: 3,
  tmp: 26,
};
```

## `lib/regionGrid.ts`

```ts
/**
 * lib/regionGrid.ts — 지역명 → 기상청 격자 좌표(nx, ny) 변환 (담당 A + B)
 *
 * MVP는 공통기반 3번의 시드 5개 지역만 다룬다(전국 확장은 2차).
 * Supabase `regions` 테이블과 동일한 데이터를 프런트 개발용으로 mock 보관한다.
 * ⚠️ nx,ny 예시값 — 실제 값은 기상청 공식 격자 좌표 엑셀로 교체 필요(A·B 협업).
 */

export interface Region {
  region_id: number;
  region_name: string;
  nx: number;
  ny: number;
}

/** 온보딩 지역 선택 화면(A+D)과 API가 공유하는 지역 목록 (regions 시드와 동일) */
export const REGIONS: Region[] = [
  { region_id: 1, region_name: "서울특별시 강남구", nx: 61, ny: 126 },
  { region_id: 2, region_name: "서울특별시 종로구", nx: 60, ny: 127 },
  { region_id: 3, region_name: "인천광역시 남동구", nx: 54, ny: 124 },
  { region_id: 4, region_name: "경기도 성남시 분당구", nx: 62, ny: 123 },
  { region_id: 5, region_name: "부산광역시 해운대구", nx: 99, ny: 75 },
];

/** region_id로 좌표 조회 (없으면 undefined) */
export function getRegionById(regionId: number): Region | undefined {
  return REGIONS.find((r) => r.region_id === regionId);
}

/** 지역명으로 좌표 조회 (없으면 undefined) */
export function getRegionByName(name: string): Region | undefined {
  return REGIONS.find((r) => r.region_name === name);
}
```

## `lib/gemini.ts`

```ts
/**
 * lib/gemini.ts — Google Gemini 호출 + fallback (담당 C)
 *
 * 공통기반 원칙:
 *  5) AI 호출 실패 시 미리 만든 템플릿 문구(fallback)로 대체해 앱이 멈추지 않게 한다.
 *  6) Gemini 호출은 지역당 1회만 하고 "이름"은 발송 시 문장에 삽입해 비용을 아낀다.
 *     → 생성 문구에는 이름 자리표시자 {name} 를 남기고, insertName()으로 채운다.
 *
 * 모델: gemini-1.5-flash (무료 티어)
 */

import type { AxisResult } from "./weather";

const MODEL = "gemini-1.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Gemini 준비 여부(키가 실제 값인지) */
export const isGeminiReady =
  !!GEMINI_API_KEY && !GEMINI_API_KEY.startsWith("여기에_");

/** 어제 대비 맥락(반복 방지) — 필요 시 프롬프트에 추가 */
export interface BriefingContext {
  regionName?: string; // 지역명 (문장 톤 참고용, 실제 이름은 {name}으로)
  yesterday?: AxisResult | null; // 어제 판정 (예: 이틀째 습함)
}

// ── 프롬프트 구성 ────────────────────────────────────────────
/** 3축 판정 → Gemini용 한국어 프롬프트 문자열 */
export function buildPrompt(axes: AxisResult, ctx: BriefingContext = {}): string {
  const lines: string[] = [];
  lines.push(
    "너는 매일 아침 사용자에게 '오늘 뭘 챙길지' 한 문장으로 알려주는 다정한 친구다."
  );
  lines.push("아래 날씨 판정을 바탕으로 행동 조언을 딱 한 문장(존댓말)으로 만들어라.");
  lines.push("규칙: 40자 내외, 이모지 1개까지 허용, 사용자 이름 자리는 반드시 {name} 로 표기.");
  lines.push("날씨를 나열하지 말고 '무엇을 챙길지/어떻게 대비할지'를 말할 것.");
  lines.push("");
  lines.push(`- 강수: ${axes.rain_axis}`);
  lines.push(`- 기온: ${axes.temp_axis ?? "정보없음"}`);
  lines.push(`- 습도·바람: ${axes.humid_axis ?? "정보없음"}`);
  if (ctx.yesterday?.humid_axis === "humid" && axes.humid_axis === "humid") {
    lines.push("- 참고: 어제도 습했음(이틀째) → 자연스럽게 언급 가능.");
  }
  lines.push("");
  lines.push("한 문장만 출력해라.");
  return lines.join("\n");
}

// ── Fallback 템플릿 ──────────────────────────────────────────
// AI 실패 시에도 축 판정만으로 그럴듯한 한 문장을 만든다. ({name} 자리표시자 유지)
export function fallbackMessage(axes: AxisResult): string {
  const parts: string[] = [];

  switch (axes.rain_axis) {
    case "rain":
    case "shower":
      parts.push("우산 꼭 챙기세요");
      break;
    case "snow":
      parts.push("눈길 미끄러우니 조심하세요");
      break;
    case "sleet":
      parts.push("비 섞인 눈이 와요, 우산 챙기세요");
      break;
    default:
      break;
  }

  switch (axes.temp_axis) {
    case "hot":
      parts.push("더우니 시원하게 입으세요");
      break;
    case "cold":
      parts.push("겉옷 단단히 챙기세요");
      break;
    case "swing":
      parts.push("일교차 크니 겉옷 하나 더 챙기세요");
      break;
    default:
      break;
  }

  if (axes.humid_axis === "humid") parts.push("습하니 통풍되는 옷이 좋아요");
  else if (axes.humid_axis === "windy") parts.push("바람 부니 가벼운 겉옷 어때요");

  const body =
    parts.length > 0 ? parts.join(", ") : "오늘은 무난한 날씨예요, 편하게 나가세요";
  return `{name}님, ${body} 🙂`;
}

// ── Gemini 호출 ──────────────────────────────────────────────
/**
 * 3축 판정으로 오늘의 조언 한 문장 생성.
 * - 키 없음 / 호출 실패 / 빈 응답이면 fallbackMessage로 대체 (앱이 멈추지 않음).
 * - 반환 문구에는 이름 자리표시자 {name} 이 포함됨 → 발송 시 insertName()으로 치환.
 */
export async function generateBriefing(
  axes: AxisResult,
  ctx: BriefingContext = {}
): Promise<string> {
  if (!isGeminiReady) return fallbackMessage(axes);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(axes, ctx) }] }],
      }),
    });

    if (!res.ok) return fallbackMessage(axes);
    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const message = text?.trim();
    if (!message) return fallbackMessage(axes);

    // 모델이 {name}을 빠뜨렸으면 앞에 붙여 일관성 유지
    return message.includes("{name}") ? message : `{name}님, ${message}`;
  } catch {
    // 네트워크/파싱 오류 등 어떤 실패든 fallback으로 (앱 지속)
    return fallbackMessage(axes);
  }
}

/** 발송 시 이름 자리표시자 {name} 를 실제 이름으로 치환 (비용 절감 원칙 6) */
export function insertName(message: string, name: string): string {
  return message.replace(/\{name\}/g, name);
}
```

## `lib/session.ts`

```ts
/**
 * lib/session.ts — 임시 클라이언트 세션 (MVP mock · 담당 A가 이후 Supabase Auth로 교체)
 *
 * 정식 인증은 2차 범위라, 지금은 온보딩 진행 상태를 localStorage에 보관해
 * 3화면(로그인 → 지역 → 시간) 흐름과 홈 분기를 먼저 동작시킨다.
 *
 * ⚠️ 브라우저 전용. 클라이언트 컴포넌트에서만 호출할 것(SSR 시 window 없음).
 */

export interface LocalSession {
  userId?: string; // 사용자 식별자 (users.user_id). 화면 명세의 localStorage user_id.
  name?: string; // 사용자 이름 (문장의 {name} 치환용)
  phone?: string; // 전화번호 (mock)
  regionId?: number; // 선택한 지역 region_id
  pushTime?: string; // "HH:MM"
  weekdays?: number[]; // 0=일 ~ 6=토
  onboarded?: boolean; // 온보딩(3화면) 완료 여부
}

const KEY = "wb_session";

/** 현재 세션 읽기 (없으면 빈 객체) */
export function getSession(): LocalSession {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : {};
  } catch {
    return {};
  }
}

/** 세션 일부 갱신(병합 저장) */
export function saveSession(patch: Partial<LocalSession>): LocalSession {
  const next = { ...getSession(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

/** 세션 초기화(로그아웃/테스트용) */
export function clearSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

/** 로그인 여부(user_id가 있으면 로그인 — 화면 명세 기준) */
export function isLoggedIn(s: LocalSession = getSession()): boolean {
  return !!s.userId;
}
```

## `supabase/schema.sql`

```sql
-- =====================================================================
-- weather-briefing · DB 스키마 (공통기반 3번 그대로) · 담당 A가 1일차에 실행
-- Supabase SQL Editor에 붙여넣고 실행하세요.
-- =====================================================================

-- 사용자
create table if not exists users (
  user_id     uuid primary key default gen_random_uuid(),
  phone       text unique not null,
  name        text not null,
  created_at  timestamptz default now()
);

-- 지역-좌표 매핑 (기상청 격자 좌표. 시드 데이터로 미리 채움)
create table if not exists regions (
  region_id    serial primary key,
  region_name  text not null,          -- 예: "서울특별시 강남구"
  nx           int not null,
  ny           int not null
);

-- 사용자 선호(즐겨찾기) 지역
create table if not exists favorite_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(user_id) on delete cascade,
  region_id   int references regions(region_id),
  label       text,                    -- "집", "회사" 등 (선택)
  created_at  timestamptz default now()
);

-- 사용자 알림 설정
create table if not exists user_settings (
  user_id       uuid primary key references users(user_id) on delete cascade,
  push_time     text default '07:00',  -- "HH:MM"
  weekdays      int[] default '{1,2,3,4,5}', -- 0=일 ~ 6=토
  push_enabled  boolean default true
);

-- 일별 날씨 기록 (축별 판정 결과 저장, 어제와 비교용)
create table if not exists weather_logs (
  id          uuid primary key default gen_random_uuid(),
  region_id   int references regions(region_id),
  date        date not null,
  rain_axis   text,   -- none/rain/snow/sleet/shower
  temp_axis   text,   -- normal/hot/cold/swing
  humid_axis  text,   -- normal/humid/windy
  sky_theme   text,   -- clear/cloudy/overcast/rain/snow (배경용)
  raw_summary jsonb,  -- 원본 요약(기온·습도 등)
  unique (region_id, date)
);

-- 푸시 발송 이력 (홈 재확인 + 기록용)
create table if not exists push_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references users(user_id) on delete cascade,
  date      date not null,
  message   text not null,
  sent_at   timestamptz default now(),
  unique (user_id, date)
);

-- =====================================================================
-- regions 시드 데이터 (MVP 5개 · 전국 확장은 2차)
-- ⚠️ nx,ny는 예시값. 기상청 공식 격자 좌표 엑셀로 검증/교체할 것 (A·B 협업).
--    lib/regionGrid.ts 의 REGIONS 와 반드시 동일하게 유지.
-- =====================================================================
insert into regions (region_name, nx, ny) values
  ('서울특별시 강남구', 61, 126),
  ('서울특별시 종로구', 60, 127),
  ('인천광역시 남동구', 54, 124),
  ('경기도 성남시 분당구', 62, 123),
  ('부산광역시 해운대구', 99, 75)
on conflict do nothing;
```

## `supabase/functions/daily-briefing/index.ts`

```ts
/**
 * supabase/functions/daily-briefing/index.ts — 매일 아침 스케줄러 (담당 C)
 *
 * Supabase Edge Function (Deno 런타임). cron으로 매 분/매 시 실행되며,
 * 지금 시각이 push_time 인 사용자에게 오늘의 조언을 생성·발송·기록한다.
 *
 * 흐름:
 *  1) 지금 시각(HH:MM)·요일에 발송 대상인 user_settings 조회 (push_enabled)
 *  2) 사용자의 즐겨찾기 지역 → 기상청 조회 → 3축 판정 (weather_logs 저장/재사용)
 *  3) 지역당 Gemini 1회 호출로 문구 생성({name} 자리표시자 유지) — 비용 절감(원칙 6)
 *  4) 사용자별로 이름 치환 후 push_logs upsert + 푸시 발송
 *
 * ⚠️ 이 파일은 뼈대(스텁)다. 실제 KMA/Gemini 호출·푸시 전송은 C가 채운다.
 *    Deno 환경이라 Next 앱의 lib/*를 직접 import하지 않고 로직을 재구현/공유한다.
 *
 * 배포:  supabase functions deploy daily-briefing
 * cron:  Supabase Dashboard > Edge Functions > Schedules (예: 매 5분)
 */

// @ts-nocheck  ← Deno 전용 파일. Next 빌드(tsconfig에서 supabase/functions 제외)와 무관.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing env" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 지금 시각(KST 기준 HH:MM)과 요일 계산
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC→KST
  const hhmm = kst.toISOString().slice(11, 16); // "07:00"
  const weekday = kst.getUTCDay(); // 0=일 ~ 6=토

  // 1) 발송 대상 조회
  const { data: targets, error } = await supabase
    .from("user_settings")
    .select("user_id, push_time, weekdays, push_enabled")
    .eq("push_enabled", true)
    .eq("push_time", hhmm);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const due = (targets ?? []).filter((t: any) =>
    Array.isArray(t.weekdays) ? t.weekdays.includes(weekday) : true
  );

  // TODO(C): 2)~4) 실제 구현
  //  - 지역별 3축 판정 + Gemini 1회 호출 → 지역 문구 캐시
  //  - 사용자별 insertName 후 push_logs upsert + 푸시 전송
  //  - 여기서는 대상 수만 반환하는 스텁.
  const processed = due.length;

  return new Response(
    JSON.stringify({ ok: true, time: hhmm, weekday, processed }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```
