# 03 · 파트 C — AI 문구 생성·푸시 발송 담당

> ⚠️ **먼저 `00_공통기반_먼저읽기.md`를 코딩 AI에 넣은 뒤 이 파일을 넣으세요.**
> 이 파일만 봐도 C 파트가 완성되도록 썼습니다.

## 담당 범위 한 줄
날씨 판정 결과로 Gemini가 아침 브리핑 문장을 만들고, 매일 아침 자동으로 푸시를 보내는 파이프라인. **아침 알림 자동화.**

## 만들 파일
- `lib/gemini.ts` — Gemini 호출 + 실패 시 템플릿 fallback
- `app/api/briefing/route.ts` — 판정 결과 받아 문구 생성
- `supabase/functions/daily-briefing/` — 매일 아침 스케줄러(Edge Function + cron)

---

## 코딩 AI에 넣을 지시문 (복사해서 사용)

```
당신은 Next.js 14 + TypeScript + Supabase 프로젝트에서
"AI 문구 생성·푸시 발송" 파트를 구현합니다.

[전제]
- 환경변수 GEMINI_API_KEY (Google AI Studio), SUPABASE_SERVICE_ROLE_KEY.
- 모델: gemini-1.5-flash.
- 입력: 날씨 3축 판정 결과 + raw_summary + 사용자 이름 + (어제 판정 결과).

[1] lib/gemini.ts
- generateBriefing(input): 아래 프롬프트로 Gemini 호출, 문장 1~2개 반환.
  프롬프트 규칙:
    - 친근한 존댓말, 아침 인사로 시작. 2문장 이내. 이모지 최대 1개.
    - 챙길 것이 있으면(우산/겉옷/양산 등) 반드시 언급.
    - 비 시작 시각(rainStartHour)이 있으면 "오후 2시부터 비" 식으로 표현.
    - 어제도 같은 축이면 "이틀째 ~" 같은 맥락 반영.
    - 날이 좋으면(모든 축 normal, 강수 없음) 안심/기분좋은 한마디.
  예시 입력→출력:
    입력: rain_axis=rain, rainStartHour=14, temp_axis=swing, name=화진
    출력: "화진님, 좋은 아침이에요. 오후 2시부터 비 소식이 있어요.
           우산 챙기시고, 저녁엔 쌀쌀하니 겉옷도 하나 있으면 좋아요 ☂️"
- fallbackBriefing(input): Gemini 호출 실패 시 사용할 규칙 기반 템플릿.
  축별로 미리 쓴 문장 6개 정도를 조합. (AI 없어도 앱이 안 죽게)

[2] app/api/briefing/route.ts
- POST로 판정 결과+이름 받아 generateBriefing 호출, 실패 시 fallback.
- { message } 반환.

[3] supabase/functions/daily-briefing (스케줄러)
- cron으로 매일 새벽(예: 21:00 UTC = 06:00 KST) 실행.
- 흐름:
    1. user_settings에서 push_enabled=true 이고 오늘 요일이 weekdays에 포함된 사용자 조회.
    2. 각 사용자의 favorite_locations → region의 nx,ny.
    3. 같은 지역은 1회만 날씨 판정(B의 함수 재사용) → 문구 생성(지역당 1회).
       (비용 절감: 이름은 발송 시 문장에 삽입/개인화)
    4. weather_logs에 오늘 판정 결과 upsert(어제 비교용).
    5. push_logs에 (user_id, date, message) 저장.
    6. 푸시 발송(아래 [4]).

[4] 푸시 발송
- MVP 데모 기준: 웹 푸시(FCM) 설정이 복잡하면, 우선 push_logs 저장까지만 하고
  홈 화면에서 문구를 보여주는 것으로 대체 가능(핵심 요구사항 충족).
- 여력 되면 FCM Web Push 연동. (푸시를 지워도 홈에서 재확인되는 게 핵심이므로
  push_logs 저장이 최우선.)

[요구]
- Gemini 실패/타임아웃 시 반드시 fallback으로 대체(앱이 멈추지 않게).
- 지역당 1회 생성으로 호출 최소화. 한국어 주석.
- mockClassification으로 키 없이 테스트 가능하게.
```

---

## 핵심 설계 포인트 (근거: 기획서 v2 핵심기능②③ + 부록 B)
- **지역당 1회 생성**: 강남구 사용자 100명이어도 문구는 1번만 만들고 이름만 끼움 → Gemini 무료 티어 절약.
- **fallback 필수**: API 실패해도 템플릿으로 대체. 발표 어필 포인트.
- **push_logs가 핵심**: 사용자가 푸시를 지워도 홈 화면(D의 AIBriefingCard)이 여기서 오늘 문구를 다시 불러옴. 이게 이 앱의 차별 기능.
- **반복 방지**: weather_logs의 어제 값과 비교해 맥락 문장 생성.

## 다른 파트와의 접점
- **B**: classifyWeather 결과·raw_summary를 재료로 받음.
- **A**: 발송 대상 사용자 목록(user_settings)·지역(favorite_locations) 사용.
- **D**: 홈의 AIBriefingCard가 push_logs에서 오늘 message를 읽어 표시.

## 산출물 확인 체크
- [ ] 판정 결과 넣으면 자연스러운 한 문장이 나온다
- [ ] Gemini 죽어도 fallback으로 문장이 나온다
- [ ] 매일 아침 스케줄러가 push_logs에 기록한다
