# mind-keyword

> 키워드가 중심인 마인드맵 필기 웹 서비스

생각을 키워드 단위로 쪼개고, 노드를 가지처럼 뻗어가며 정리하는 마인드맵 기반 필기 도구입니다. PDF를 업로드하면 AI가 핵심 키워드를 추출해 마인드맵 초안을 만들어 줍니다.
백엔드는 직접 설계·구현했으며, 프론트엔드는 AI 페어 프로그래밍으로 작업했습니다.

---

<img src="/images/스크린샷 2026-06-17 오전 11.19.59.png">
<img src="/images/스크린샷 2026-06-17 오전 11.20.10.png">
<img src="/images/스크린샷 2026-06-17 오전 11.24.10.png">
<img src="/images/스크린샷 2026-06-17 오전 11.24.25.png">

## 주요 기능

- **마인드맵 캔버스** — React Flow 기반의 노드 트리 편집 (생성 / 편집 / 삭제 / 포커스 이동)
- **키보드 중심 워크플로우** — `Tab`(자식), `Enter`(형제), 방향키 이동 등 단축키로 빠른 필기
- **폴더 정리** — 마인드맵을 폴더로 그룹화
- **PDF → 마인드맵** — PDF 텍스트를 추출해 Gemini API로 키워드 마인드맵 자동 생성
- **인증** — 이메일 인증 회원가입 + JWT(Access / Refresh) 로그인, Google·Naver OAuth2 소셜 로그인

---

## 기술 스택

### Frontend
| 분류 | 기술 |
|---|---|
| Framework | React 19, TypeScript |
| Build | Vite 8 |
| 마인드맵 | React Flow (`@xyflow/react`) |
| HTTP | Axios |
| 기타 | jsPDF, html-to-image, lucide-react |

### Backend
| 분류 | 기술 |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.0.6 |
| Security | Spring Security, JWT (JJWT 0.12.6), OAuth2 Client |
| Persistence | Spring Data JPA, H2(개발) / MySQL(운영), Redis |
| 기타 | PDFBox, Spring Mail, Bean Validation |

---

## 시작하기

### Backend

```bash
cd backend

# 애플리케이션 실행 (http://localhost:8080)
./gradlew bootRun

# 빌드 (컴파일 + 테스트)
./gradlew build

# 테스트
./gradlew test
```

개발 환경에서는 H2 인메모리 DB를 사용하며, H2 콘솔은 `/h2-console`에서 접근할 수 있습니다.

### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

> API는 `http://localhost:8080`으로 직접 호출합니다. 백엔드 CORS는 `localhost:5173`, `localhost:3000`을 허용합니다.

---

## 키보드 단축키 (마인드맵 캔버스)

| 단축키 | 동작 |
|---|---|
| `Ctrl + 더블클릭` (빈 캔버스) | 루트 노드 생성 |
| 노드 더블클릭 / `F2` | 노드 내용 편집 |
| `Tab` | 선택 노드의 자식 노드 생성 |
| `Enter` | 형제 노드 생성 (루트면 자식 생성) |
| `Delete` / `Backspace` | 선택 노드 삭제 (하위 노드 포함) |
| `← → ↑ ↓` | 인접 노드로 포커스 이동 |

---

## 인증 흐름

1. **로그인** (일반 / OAuth2) → Access Token(단기) + Refresh Token(30일) 발급, Refresh Token은 DB에 저장
2. **API 요청** → Access Token을 `Authorization: Bearer` 헤더로 전송
3. **Access Token 만료(401)** → 저장된 Refresh Token으로 `/api/v1/users/refresh` 자동 호출, 새 Access Token 발급 후 원래 요청 재시도
4. **Refresh Token 만료** → 자동 로그아웃
5. **로그아웃** → 서버 DB의 Refresh Token 삭제

---

## API 개요

모든 엔드포인트는 `/api/v1` 접두사를 가지며, 응답은 `ApiResponse<T>` (`{ "success": true, "data": ... }`) 형태로 감싸집니다.

| 리소스 | 기본 경로 |
|---|---|
| 사용자 | `/api/v1/users` — `signup`, `login`, `logout`, `refresh` |
| 폴더 | `/api/v1/folders` |
| 마인드맵 | `/api/v1/mindmaps` |
| 노드 | `/api/v1/mindmaps/{mindMapId}/nodes` (루트는 `/root`) |

---

## 프로젝트 구조

```
mind-keyword/
├── backend/    # Spring Boot — 도메인(user, folder, mindmap, node) + global(config, jwt, exception)
└── frontend/   # React + Vite — pages, api, types
```

자세한 아키텍처와 개발 가이드는 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.
