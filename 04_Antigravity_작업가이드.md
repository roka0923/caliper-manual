# Google Antigravity 작업 가이드

## 작업 시작 전 체크리스트

### 1. Antigravity에 프로젝트 연결
- GitHub 저장소를 먼저 만들고 Antigravity에 연결하세요
- 저장소 이름 추천: `caliper-works`

### 2. 프롬프트 입력 순서
```
01_기획안.md           → 먼저 읽어보고 전체 구조 파악
02_Antigravity_프롬프트.md → 순서대로 하나씩 입력
03_Firestore_데이터구조.md → 데이터 관련 질문 시 참고용으로 제공
04_참고_소스코드.html     → 완성된 참고 코드 (필요 시 제공)
```

### 3. 추천 작업 흐름

```
프롬프트 0 (프로젝트 세팅)
  ↓
프롬프트 1 (앱 껍데기)
  ↓ 화면이 뜨는지 확인
프롬프트 2 (Firebase 연동)
  ↓ 제품 목록이 나오는지 확인
프롬프트 3 (검색)
  ↓ 검색이 되는지 확인
프롬프트 4 (상세 화면)
  ↓ 상세 화면 전환 확인
프롬프트 5 (부품 상세)
  ↓ 부품 역방향 검색 확인
프롬프트 6 (이미지)
  ↓ 사진 표시 확인
프롬프트 7 (PWA + 배포)
  ↓
프롬프트 8 (보안 규칙)
  ↓
프롬프트 9 (최종 테스트)
```

---

## Antigravity 사용 팁

### 에이전트에게 전체 맥락 주기

첫 프롬프트를 입력하기 전에, 기획안 파일을 통째로 제공하면 에이전트가 전체 맥락을 이해합니다:

```
이 프로젝트의 기획안입니다. 먼저 읽어보세요:

[01_기획안.md 내용 전체 붙여넣기]

이 기획안을 바탕으로 개발을 진행하겠습니다.
```

### 에러가 발생했을 때

```
에러가 발생했습니다:
[에러 메시지 붙여넣기]

이 에러를 수정해주세요. 다른 기능은 변경하지 마세요.
```

### 디자인 수정 요청할 때

```
[구체적 위치]의 디자인을 수정해주세요:
- 현재: [현재 상태 설명]
- 원하는 것: [원하는 상태 설명]

다른 부분은 그대로 유지해주세요.
```

### 파일 구조를 잃어버렸을 때

```
현재 프로젝트의 전체 파일 목록과 각 파일의 역할을 정리해주세요.
```

---

## 주의사항

### 단일 파일 유지
이 프로젝트는 index.html 하나의 파일에 HTML, CSS, JavaScript를 모두 포함합니다.
Antigravity가 파일을 분리하려고 하면 아래와 같이 안내하세요:

```
이 프로젝트는 단일 HTML 파일로 유지합니다.
HTML, CSS, JavaScript를 별도 파일로 분리하지 마세요.
모든 코드를 index.html 안에 포함해주세요.
```

### Firebase SDK 버전
CDN compat 버전 10.12.0을 사용합니다. 모듈러 버전(v9+)으로 바꾸지 않도록 주의하세요:

```
Firebase SDK는 CDN compat 버전을 사용합니다:
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>

모듈러 SDK (import/export 방식)로 변경하지 마세요.
```

### Firebase 설정값 보호
Firebase API Key와 Project ID는 localStorage에 저장합니다.
코드에 하드코딩하지 않도록 주의하세요.
최초 실행 시 사용자가 직접 입력하는 방식을 유지합니다.

---

## 배포 후 직원 안내 방법

### Android
1. Chrome에서 앱 URL 접속
2. 메뉴(⋮) → "홈 화면에 추가"
3. "Caliper Works" 이름 확인 → "추가"

### iPhone
1. Safari에서 앱 URL 접속
2. 공유 버튼(□↑) → "홈 화면에 추가"
3. "Caliper Works" 이름 확인 → "추가"

### 최초 설정
1. 앱 실행
2. Firebase 설정 화면에서 API Key, Project ID, Storage Bucket 입력
3. "연결하기" 버튼 탭
4. 제품 목록이 표시되면 완료
