# Caliper Works - Google Antigravity 개발 프롬프트

> 아래 프롬프트를 순서대로 Antigravity에 입력하여 앱을 개발합니다.
> 각 단계마다 결과를 확인한 후 다음 단계로 진행하세요.

---

## 프롬프트 0: 프로젝트 초기 설정

```
새 프로젝트를 시작합니다. "Caliper Works"라는 PWA 웹앱을 만들 것입니다.

프로젝트 구조:
- public/index.html (메인 앱 - 단일 HTML 파일)
- public/manifest.json (PWA 매니페스트)
- firebase.json (Firebase Hosting 설정)
- .firebaserc (Firebase 프로젝트 설정)

기술 스택:
- 순수 HTML + CSS + JavaScript (프레임워크 없음, 단일 파일)
- Firebase Firestore (데이터 읽기)
- Firebase Storage (이미지 로드)
- Firebase Hosting (배포)
- PWA (홈 화면 추가 가능)

Firebase 프로젝트: daehansa-workflow
Firebase SDK: CDN 방식 (compat 버전 10.12.0)

먼저 이 프로젝트 구조를 세팅해주세요.
firebase.json은 public 폴더를 hosting 대상으로 설정하고,
.firebaserc는 daehansa-workflow 프로젝트를 기본으로 설정해주세요.
```

---

## 프롬프트 1: 기본 앱 껍데기 만들기

```
Caliper Works 앱의 기본 구조를 만들어주세요.
이 앱은 브레이크 캘리퍼 제조 현장에서 직원들이 제품 정보를 조회하는 모바일 웹앱입니다.

index.html 하나의 파일에 HTML, CSS, JavaScript를 모두 포함합니다.

디자인 요구사항:
- 다크 테마 (배경 #0a0a0a, 카드 #1a1a1a)
- 액센트 컬러: 오렌지 (#FF6B35)
- 폰트: 코드/숫자는 JetBrains Mono, 한글은 Noto Sans KR (Google Fonts CDN)
- 모바일 최적화 (max-width: 600px 중앙 정렬)
- safe-area-inset 지원 (iPhone 노치 대응)

화면 구성:
1. 상단 고정 헤더: 로고 "Caliper Works" + 설정 버튼
2. 검색바: 고정, 돋보기 아이콘 + 입력 필드 + 클리어 버튼
3. 메인 콘텐츠: 제품 리스트 영역
4. 로딩 스피너 상태
5. 빈 결과 상태

최초 실행 시 Firebase 설정 입력 화면을 보여주고,
설정값은 localStorage에 저장합니다.
설정 항목: API Key, Project ID, Storage Bucket

manifest.json도 함께 만들어주세요:
- name: "Caliper Works"
- display: standalone
- theme_color: #0a0a0a
- background_color: #0a0a0a
```

---

## 프롬프트 2: Firebase 연동 및 제품 목록

```
Firebase Firestore에서 products 컬렉션을 읽어서 제품 목록을 표시해주세요.

Firebase SDK는 CDN compat 버전을 사용합니다:
- firebase-app-compat.js (10.12.0)
- firebase-firestore-compat.js (10.12.0)  
- firebase-storage-compat.js (10.12.0)

products 컬렉션의 각 문서 구조:
- 코드: "11011" (제품 코드)
- 코드모델명: "11011_아토스 LH"
- 제조사: "현대"
- 시스템: "만도"
- 타입: "1P"
- 니플: "L"

제품 카드 디자인:
- 왼쪽: 56x56 썸네일 (일단 📦 아이콘 placeholder)
- 중앙: 코드 (오렌지, 큰 글씨, JetBrains Mono), 모델명, 태그 (제조사/타입/시스템)
- 오른쪽: 화살표 아이콘

로딩 중에는 스피너를 보여주고, 
로딩 완료 후 "XX개 제품" 카운트를 표시합니다.
Firestore 연결 실패 시 에러 메시지와 설정 변경 버튼을 보여줍니다.
```

---

## 프롬프트 3: 검색 기능

```
검색 기능을 추가해주세요.

검색 대상 필드:
- 코드, 코드모델명, 제조사, 시스템, 검색창내용, 호환차종, 타입
- 피스톤1~3, 씰1~3, 부트1~3, 핀1~2, 핀부트1~3

동작 방식:
- 클라이언트 사이드 필터링 (Firestore에서 전체 로드 후 JS에서 필터)
- 입력 시 200ms 디바운스 후 필터링
- 대소문자 무시
- 검색어 지우기 버튼 (X)
- 결과 없으면 "검색 결과가 없습니다" 빈 상태 표시
```

---

## 프롬프트 4: 제품 상세 화면

```
제품 카드를 탭하면 상세 화면이 오른쪽에서 슬라이드되어 나오도록 해주세요.

상세 화면 구성:

1) 상단 헤더 (sticky):
   - 뒤로가기 버튼 "← 목록"
   - 제품 코드 타이틀

2) 제품 사진 영역:
   - 4:3 비율, 둥근 모서리
   - Firebase Storage에서 이미지 로드 시도
   - 탐색 경로: products/{코드}.jpg → .png → .JPG → .jpeg
   - 없으면 📦 placeholder
   - 또한 문서의 '이미지', '이미지1', 'alt=media' 필드에 URL이 있으면 그것을 사용

3) 제품 정보 섹션:
   - 섹션 타이틀: "제품 정보" (오렌지, 대문자, 모노스페이스, 오른쪽에 구분선)
   - 2열 그리드: 코드, 모델명, 제조사, 시스템, 타입, 니플
   - 전체 너비: 규격, 하우징, 캐리어, 호환차종, 검색참고

4) BOM 섹션:
   - 섹션 타이틀: "BOM (부속품)"
   - 부품 유형별 색상 배지:
     - 피스톤: 오렌지 (#FF6B35)
     - 씰: 파랑 (#60A5FA)
     - 부트: 초록 (#34D399)
     - 핀: 노랑 (#FBBF24)
     - 핀부트: 보라 (#A78BFA)
   - 각 항목: 유형 배지 + 부품코드 + 화살표 (탭 가능)
   - 빈 값은 표시하지 않음

5) 위치 정보 섹션:
   - 섹션 타이틀: "위치 정보"
   - 2열 그리드 카드: 완제품, 하우징, 캐리어, 창고, 고품
   - 위치 값은 노란색 (#FBBF24) 크게 표시
   - 값이 없거나 "-"이면 회색으로 "-" 표시

6) 메모 섹션 (제품관련 적요가 있을 때만):
   - 섹션 타이틀: "메모"

브라우저 뒤로가기 버튼도 지원해주세요 (history.pushState 사용).
```

---

## 프롬프트 5: 부품 상세 화면

```
BOM에서 부품을 탭하면 부품 상세 화면이 추가로 슬라이드되어 나오도록 해주세요.

부품 상세 화면:
1) 헤더: "← 제품" 뒤로가기 + 부품코드 타이틀

2) 부품 정보:
   - 부품코드, 구분 (피스톤/씰/부트/핀/핀부트)

3) 상세 스펙:
   - 현재는 데이터가 없으므로 "상세 스펙 데이터 준비 중입니다" 안내 표시
   - 📐 아이콘 + 안내 텍스트
   - 추후 별도 Firestore 컬렉션에서 데이터를 가져올 예정

4) 사용 제품 목록:
   - 이 부품코드가 포함된 모든 제품을 역방향 검색
   - products 컬렉션의 피스톤1~3, 씰1~3, 부트1~3, 핀1~2, 핀부트1~3 필드를 검색
   - 각 항목: 제품코드 + 모델명 + 화살표 (탭하면 해당 제품 상세로 이동)
   - "사용 제품 (N개)" 형태로 개수 표시

이 화면도 브라우저 뒤로가기를 지원해야 합니다.
```

---

## 프롬프트 6: 제품 썸네일 이미지 로드

```
제품 리스트의 썸네일 이미지를 Firebase Storage에서 비동기로 로드해주세요.

동작 방식:
1. 제품 리스트 렌더링 시 일단 📦 placeholder 표시
2. 각 제품에 대해 비동기로 이미지 로드 시도
3. 먼저 제품 문서의 '이미지', '이미지1', 'alt=media' 필드에 URL이 있는지 확인
4. URL이 있으면 그것을 사용
5. 없으면 Firebase Storage에서 products/{코드}.jpg → .png → .JPG 순서로 시도
6. 이미지를 찾으면 썸네일 교체
7. 이미지 캐시 객체(imageCache)에 저장하여 상세 화면에서 재사용
8. 이미지 로드 실패 시 placeholder 유지

주의: 이미지 로드가 리스트 스크롤 성능에 영향을 주면 안 됩니다.
```

---

## 프롬프트 7: PWA 설정 및 Firebase Hosting 배포 준비

```
PWA와 배포 설정을 완성해주세요.

1) manifest.json:
   - name: "Caliper Works"
   - short_name: "CaliperWorks"  
   - description: "브레이크 캘리퍼 생산 참고 앱"
   - start_url: "/index.html"
   - display: standalone
   - background_color: "#0a0a0a"
   - theme_color: "#0a0a0a"
   - orientation: portrait

2) index.html에 PWA 메타태그:
   - <meta name="theme-color" content="#0a0a0a">
   - <meta name="apple-mobile-web-app-capable" content="yes">
   - <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   - <link rel="manifest" href="manifest.json">

3) firebase.json:
   {
     "hosting": {
       "public": "public",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [{ "source": "**", "destination": "/index.html" }]
     }
   }

4) .firebaserc:
   {
     "projects": {
       "default": "daehansa-workflow"
     }
   }
```

---

## 프롬프트 8: Firestore 보안 규칙

```
Firestore 보안 규칙을 설정해주세요.

이 앱은 읽기 전용 조회 앱이므로, products 컬렉션에 대해서만 읽기를 허용합니다.
쓰기는 모두 차단합니다 (데이터 입력은 AppSheet에서 수행).

firestore.rules 파일을 만들어주세요:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // products 컬렉션 읽기 허용
    match /products/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    // 나머지 컬렉션은 모두 차단
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

주의: 기존 daehansa-workflow 프로젝트의 다른 컬렉션 규칙에 영향을 주지 않도록 확인해주세요.
```

---

## 프롬프트 9: 최종 테스트 및 디버깅

```
앱을 최종 점검해주세요.

체크리스트:
1. Firebase 연결 테스트: Firestore에서 products 컬렉션을 정상적으로 읽는가?
2. 검색 테스트: 코드, 모델명, 차종으로 검색이 되는가?
3. 상세 화면: 슬라이드 전환이 부드러운가?
4. BOM 표시: 부속품이 올바르게 표시되는가?
5. 위치 정보: 완제품/하우징/캐리어/창고/고품 위치가 정확한가?
6. 부품 상세: 역방향 검색(사용 제품)이 정확한가?
7. 이미지 로드: Storage에서 사진이 정상적으로 표시되는가?
8. 뒤로가기: 브라우저 백 버튼이 각 화면에서 정상 동작하는가?
9. 모바일: 모바일 화면에서 레이아웃이 깨지지 않는가?
10. 설정 변경: 설정 모달에서 Firebase 정보를 수정할 수 있는가?

오류가 있으면 수정해주세요.
```

---

## 추가 프롬프트 (향후 기능 확장 시)

### A. 부품 상세 스펙 추가

```
부품 상세 스펙을 표시하는 기능을 추가해주세요.

Firestore에 새로운 컬렉션 'parts'를 읽어옵니다.
문서 ID는 부품코드 (예: "P545104")입니다.

parts 컬렉션 필드:
- code: "P545104"
- 구분: "피스톤 [국산]"
- 세부사항: "[피스톤]"
- D_mm: 54.00
- D_mm2: 45.00
- H_mm: 51.00
- N_Figure: "8881"
- Ref1: ""
- Ref2: ""
- 통합품번: "[P545104] - / -"
- 이미지: (URL)

부품 상세 화면에서 "상세 스펙 데이터 준비 중" 대신 실제 스펙을 표시합니다.
parts 컬렉션에 해당 부품이 없으면 기존 "준비 중" 메시지를 유지합니다.
```

### B. QR코드 스캔 기능

```
QR코드 스캔으로 제품을 바로 조회하는 기능을 추가해주세요.

검색바 옆에 QR 스캔 버튼을 추가합니다.
html5-qrcode 라이브러리를 CDN으로 불러옵니다.
QR코드에 제품 코드가 인코딩되어 있으면 바로 해당 제품 상세 화면을 엽니다.
카메라 권한 요청을 처리하고, 
스캔 실패 시 적절한 에러 메시지를 보여줍니다.
```

### C. 오프라인 모드

```
Service Worker를 추가하여 오프라인에서도 앱을 사용할 수 있게 해주세요.

캐시 전략:
- HTML, CSS, JS, 폰트: Cache First (설치 시 캐시)
- Firestore 데이터: Network First, 실패 시 캐시 사용
- 이미지: Cache First, 없으면 네트워크

오프라인 상태일 때 상단에 "오프라인 모드" 배너를 표시합니다.
온라인 복귀 시 자동으로 데이터를 새로고침합니다.
```
