# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**mind-keyword**는 키워드 중심의 마인드맵 필기 웹 서비스입니다. `backend/` (Spring Boot)와 `frontend/` (React + Vite)로 구성됩니다.

## 프론트엔드 명령어

모든 명령어는 `frontend/` 디렉토리에서 실행합니다.

```bash
# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

**기술 스택:** React 19, TypeScript, Vite 8, React Flow (`@xyflow/react`), Axios

**주요 구조:**
```
frontend/src/
├── api/
│   ├── client.ts     # axios 인스턴스 (baseURL: http://localhost:8080, JWT 자동 첨부)
│   ├── auth.ts       # 회원가입, 로그인
│   └── mindmap.ts    # 마인드맵, 노드, 폴더 CRUD
├── pages/
│   ├── LandingPage.tsx    # 서비스 소개 + 로그인 진입
│   ├── LoginPage.tsx      # 로그인 / 회원가입 폼 (탭 전환)
│   └── WorkspacePage.tsx  # 사이드바 + React Flow 마인드맵 캔버스
├── types/
│   └── index.ts      # MindMap, Folder, NodeData 타입 (백엔드 DTO 1:1 대응)
├── App.tsx           # 페이지 상태 관리 (landing ↔ workspace), React Router 미사용
└── main.tsx
```

**페이지 흐름:**
- `App.tsx`가 `page` 상태(`'landing' | 'workspace'`)로 화면 전환 (React Router 미사용)
- `LandingPage` → 로그인 버튼 클릭 → `LoginPage` → 로그인 성공 → `WorkspacePage`

**개발 참고:**
- API는 `http://localhost:8080`으로 직접 호출 (Vite 프록시 미사용) → CORS 허용 출처: `localhost:5173`, `localhost:3000`
- JWT 토큰은 `localStorage`에 `token` 키로 저장
- 라우터 없이 상태 기반으로 페이지 전환하므로 URL이 변하지 않음
- `WorkspacePage` 내 `Canvas` 컴포넌트가 React Flow 캔버스를 담당

**키보드 단축키 (마인드맵 캔버스):**
| 단축키 | 동작 |
|---|---|
| `Ctrl + 더블클릭` (빈 캔버스) | 루트 노드 생성 |
| 노드 더블클릭 | 노드 내용 편집 |
| `Tab` | 선택 노드의 자식 노드 생성 |
| `Enter` | 형제 노드 생성 (루트면 자식 생성) |
| `Delete` / `Backspace` | 선택 노드 삭제 (하위 노드 포함) |
| `←→↑↓` | 인접 노드로 포커스 이동 |
| `F2` | 선택 노드 편집 모드 |

---

## 백엔드 명령어

모든 명령어는 `backend/` 디렉토리에서 실행합니다.

```bash
# 애플리케이션 실행
./gradlew bootRun

# 빌드 (컴파일 + 테스트)
./gradlew build

# 전체 테스트 실행
./gradlew test

# 단일 테스트 클래스 또는 메서드 실행
./gradlew test --tests "com.xoxoisme.mindkeyword.ClassName"
./gradlew test --tests "com.xoxoisme.mindkeyword.ClassName.methodName"
```

**기술 스택:** Java 21, Spring Boot 4.0.6, Gradle (Kotlin DSL), Spring Security, Spring Data JPA, JJWT 0.12.6, Lombok, H2 (개발) / MySQL (운영), Bean Validation

개발 환경에서 H2 콘솔은 `/h2-console`에서 접근 가능합니다 (인증 불필요).

## 아키텍처

### 패키지 구조

```
com.xoxoisme.mindkeyword
├── domain/
│   ├── folder/     # 폴더 CRUD
│   ├── mindmap/    # 마인드맵 CRUD
│   ├── node/       # 노드 CRUD (트리 구조)
│   └── user/       # 인증 (회원가입, 로그인, 로그아웃)
└── global/
    ├── common/
    │   ├── entity/     # BaseEntity (id), BaseTimeEntity (createdAt, updatedAt)
    │   ├── exception/  # BusinessException, ErrorCode enum, GlobalExceptionHandler
    │   └── response/   # ApiResponse<T>, ErrorResponse
    ├── config/         # SecurityConfig (Spring Security + CORS)
    └── jwt/            # JwtTokenProvider, JwtAuthentificationFilter
```

각 도메인 패키지는 동일한 계층 구조를 따릅니다: `controller → service → repository`, 그리고 `dto/request`, `dto/response`, `entity`.

### 도메인 모델

```
User ──< Folder
User ──< MindMap >── Folder (선택)
MindMap ──< Node >── Node (자기 참조 부모/자식 트리)
```

- `MindMap`은 선택적으로 `Folder`에 속합니다 (폴더 없이도 존재 가능).
- `Node`는 nullable `parent`를 가집니다 (null = 루트 노드). 루트 노드는 `Node.createRoot()`로, 자식 노드는 `Node.createChild()`로 생성합니다.
- 노드를 삭제하면 모든 하위 노드가 재귀적으로 삭제됩니다 (`NodeService.deleteRecursively`).

### 엔티티 규칙

- 모든 엔티티는 `BaseEntity`(자동 생성 `Long id`) → `BaseTimeEntity`(`createdAt`, `updatedAt`, JPA Auditing)를 상속합니다.
- 엔티티 생성은 정적 팩토리 메서드를 사용합니다 (`Folder.create()`, `MindMap.create()`, `Node.createRoot()`, `Node.createChild()`). 생성자는 `protected`로 제한됩니다 (Lombok `@NoArgsConstructor(access = PROTECTED)`).
- 상태 변경은 엔티티의 명시적 메서드를 통해 수행합니다 (예: `folder.rename()`, `node.update()`).

### API 설계

모든 엔드포인트는 `/api/v1` 접두사를 가집니다. 응답은 `ApiResponse<T>` (`{ "success": true, "data": ... }`)로 감쌉니다. 오류는 `GlobalExceptionHandler`에서 `ErrorResponse`로 반환합니다.

| 리소스 | 기본 경로 |
|---|---|
| 사용자 | `/api/v1/users` — `POST /signup`, `POST /login`, `POST /logout` |
| 폴더 | `/api/v1/folders` |
| 마인드맵 | `/api/v1/mindmaps` |
| 노드 | `/api/v1/mindmaps/{mindMapId}/nodes` — 루트 노드는 `/root` |

인증 불필요 엔드포인트: `/api/v1/users/signup`, `/api/v1/users/login`, `/api/v1/users/logout`, `/h2-console/**`

### 인증

- 무상태(Stateless) JWT 방식. `JwtAuthentificationFilter`가 토큰을 추출하고 `userId`(Long)를 `Authentication` principal로 설정합니다.
- 컨트롤러에서 현재 사용자는 `(Long) authentication.getPrincipal()`로 가져옵니다.
- JWT 시크릿과 만료 시간은 `jwt.secret`, `jwt.expiration` 프로퍼티로 설정합니다.
- CORS는 `http://localhost:3000`, `http://localhost:5173`을 허용하도록 설정되어 있습니다.

### 예외 처리

- 도메인 오류는 `BusinessException(ErrorCode)`을 던집니다.
- `ErrorCode`는 코드 문자열, HTTP 상태, 한국어 메시지를 가진 enum입니다.
- `GlobalExceptionHandler`(`@RestControllerAdvice`)가 `BusinessException`을 잡아 적절한 HTTP 상태와 함께 `ErrorResponse`를 반환합니다.

### 서비스 규칙

- 서비스 클래스는 클래스 레벨에 `@Transactional(readOnly = true)`를 적용하고, 쓰기 메서드에서 `@Transactional`로 재정의합니다.
- 소유권 검사(예: `getOwnedMindMap`)는 리소스가 인증된 사용자의 것인지 확인하고, 그렇지 않으면 `FORBIDDEN`을 던집니다.
