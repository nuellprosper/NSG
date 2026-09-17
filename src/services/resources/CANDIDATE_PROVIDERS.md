# Candidate Resource & Question Providers Verification

## Provider API & Licensing Verification Registry

Before integrating any external provider, this registry records official API documentation, license terms, authentication mechanisms, rate limits, and architectural compatibility.

---

### 1. ALOC (African Leadership On-Demand Curriculum / Assessment Content Infrastructure)

- **Domain**: Assessment Content Infrastructure (African EdTech)
- **Official Documentation**: `dev.aloc.com.ng` / `aloc.com.ng` (ALOC Station v1)
- **Documented API Exists?**: Yes. OpenAPI 3.1 schema and interactive Swagger docs hosted at `dev.aloc.com.ng/api/v1`.
- **Available Endpoints**:
  - `GET /api/v1/questions` (Query examination past questions by exam body, year, subject)
  - `GET /api/v1/subjects` (Catalog of supported examination syllabi: WAEC, JAMB, NECO)
  - `GET /api/v1/years`
  - `POST /api/v1/verify`
- **Intended Use Compatibility**:
  - **Courses & Books (Digital Library)**: **INCOMPATIBLE / NOT PERMITTED**. ALOC provides question bank records (JSON with prompt, options, answer, metadata). It does NOT provide textbooks, digital course packs, lecture PDFs, or EPUB reader assets.
  - **CBT / Past Questions Engine**: **POTENTIAL FUTURE CANDIDATE**. Compatible for interactive quizzes and examination prep if credentials are provisioned.
- **Authentication & Security**:
  - Requires `X-API-Key` header on all requests.
  - **Security Mandate**: Never expose ALOC API keys in client-side code or `VITE_*` variables. All queries must be proxied via backend server routes (`/api/aloc/*`).
- **Rate Limits & Credits**:
  - Credit-based consumption model (e.g. 1 credit per question, 10 credits for L3 AI explanations).
  - Free tier is strictly capped at 1,000 monthly credits.
- **Licensing & Rights**:
  - Commercial proprietary API terms. Content is licensed for EdTech assessment applications under ALOC developer terms.
- **Current Status**:
  - **Documented Future Candidate for CBT/Exam Prep**.
  - **Intentionally OMITTED from the Courses & Books document repository** to preserve provider isolation and prevent mock/scraped implementations.

---

### 2. Active Integrated Providers (Courses & Books)

| Provider | Documented API / Catalog | Direct Assets | Licensing / Rights | Normalized Capabilities |
|---|---|---|---|---|
| **OpenStax** | Official OpenStax Book Catalog & API | Direct PDFs & Rex Web Reader | CC BY 4.0 / CC BY-NC-SA 4.0 | `downloadable: true`, `readableOnline: true`, `borrowable: false` |
| **Project Gutenberg (Gutendex)** | `gutendex.com/books` REST API | Direct EPUB, TXT, PDF, HTML | Public Domain (Project Gutenberg License) | `downloadable: true`, `readableOnline: true`, `borrowable: false` |
| **Open Library** | `openlibrary.org/search.json` | Controlled Lending & Internet Archive 2-up reader | Controlled Digital Lending (CDL) & Public Scans | `downloadable: false`, `readableOnline: true` (Archive 2up), `borrowable: true` |
| **NSG Community Drive** | Firestore & Google Drive Proxy | Peer study guides & lecture notes | Peer Educational Sharing (Verified) | `downloadable: true`, `readableOnline: true`, `borrowable: false` |
