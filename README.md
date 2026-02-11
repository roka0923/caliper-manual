# 📁 Caliper Works 개발 패키지

이 폴더에는 Google Antigravity에서 Caliper Works PWA 웹앱을 개발하기 위한 모든 자료가 포함되어 있습니다.

---

## 파일 목록

| 파일 | 내용 | 용도 |
|------|------|------|
| **01_기획안.md** | 프로젝트 전체 기획서 | Antigravity에 전체 맥락 제공 |
| **02_Antigravity_프롬프트.md** | 단계별 개발 프롬프트 10개 + 확장 프롬프트 3개 | 순서대로 Antigravity에 입력 |
| **03_Firestore_데이터구조.md** | Firestore 컬렉션/필드 상세 명세 | 데이터 관련 참고용 |
| **04_Antigravity_작업가이드.md** | 작업 흐름, 사용 팁, 주의사항 | 작업 진행 시 참고 |
| **05_참고_소스코드.html** | Claude가 생성한 완성 소스코드 | 참고용 (전체 복사 또는 부분 참고) |
| **06_Firebase_설정파일.md** | firebase.json, 보안규칙, 배포 명령어 | 배포 시 참고 |

---

## 빠른 시작

### 방법 1: 참고 소스코드를 바로 사용
`05_참고_소스코드.html`을 Firebase Hosting에 바로 배포할 수 있습니다.

### 방법 2: Antigravity에서 처음부터 개발
1. `01_기획안.md`를 Antigravity에 먼저 제공 (전체 맥락 파악용)
2. `02_Antigravity_프롬프트.md`의 프롬프트를 0번부터 순서대로 입력
3. 각 단계 완료 후 결과 확인 → 다음 단계 진행
4. 필요 시 `03_Firestore_데이터구조.md` 참고

### 방법 3: 참고 소스코드를 Antigravity에 제공 후 수정
1. `05_참고_소스코드.html`을 Antigravity에 제공
2. "이 코드를 기반으로 프로젝트를 세팅해줘"
3. 원하는 수정사항을 추가 요청

---

## 핵심 포인트

- **단일 HTML 파일**: 모든 코드가 index.html 하나에 포함
- **Firebase compat SDK**: CDN 방식, 버전 10.12.0
- **다크 테마**: 현장 작업자 눈 피로 최소화
- **읽기 전용**: 데이터 입력은 AppSheet에서, 조회만 이 앱에서
- **사용자 수 무제한**: Firebase 무료 티어로 운영
