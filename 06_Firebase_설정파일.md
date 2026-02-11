# Firebase 설정 파일

## firebase.json (Hosting 설정)

```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.json",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=3600"
          }
        ]
      }
    ]
  }
}
```

## .firebaserc (프로젝트 설정)

```json
{
  "projects": {
    "default": "daehansa-workflow"
  }
}
```

## firestore.rules (보안 규칙)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // products 컬렉션: 읽기만 허용
    match /products/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // parts 컬렉션: 읽기만 허용 (추후 추가)
    match /parts/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // 나머지: 기존 규칙 유지
    // 주의: 기존 daehansa-workflow의 규칙과 병합 필요
  }
}
```

## 배포 명령어

```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화 (최초 1회)
firebase init hosting
# → public 폴더 선택
# → SPA 설정: Yes

# 배포
firebase deploy --only hosting

# 보안 규칙만 배포
firebase deploy --only firestore:rules
```

## 폴더 구조

```
caliper-works/
├── public/
│   ├── index.html        ← 메인 앱 (단일 파일)
│   └── manifest.json     ← PWA 매니페스트
├── firebase.json         ← Hosting 설정
├── .firebaserc           ← 프로젝트 연결
└── firestore.rules       ← 보안 규칙
```
