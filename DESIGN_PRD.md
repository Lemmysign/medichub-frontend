# MedicHub Academy — Design PRD (for AI designer)

> **Purpose:** Produce a complete, modern, trustworthy UI design system and high-fidelity screens
> for MedicHub Academy. This document is the brief. Deliver a cohesive design we will implement
> in **React + Tailwind CSS v4 + shadcn/ui** — so design with tokens and components that map to
> that stack (no bespoke effects that can't be built with Tailwind/Radix).

---

## 1. Product in one paragraph
MedicHub Academy is a **subscription-based medical e-learning platform** for Nigeria — think Udemy,
but one subscription unlocks **everything**. Medical professionals and licensing-exam candidates
subscribe to watch course videos, download study materials, take **auto-graded mock tests and timed
mock exams**, track progress, and ask instructors questions. It serves **three roles in one web app**:
**Student**, **Instructor**, and **Admin** (the platform owner). Web first; a mobile app comes later.

## 2. Audiences & tone
- **Students** — busy doctors/medical students under exam pressure. Need clarity, focus, fast access
  to study tools, and a calm, confidence-inspiring feel. Mobile-heavy usage.
- **Instructors** — create courses, upload videos/materials, author tests & mock exams, answer Q&A.
  Need efficient, dense management screens.
- **Admin** — monitors metrics, revenue, accounts, settings. Needs a clean back-office/dashboard feel.
- **Voice:** professional, credible, medical-grade — reassuring, not childish; modern, not sterile.

## 3. Design objectives
1. **Look premium and trustworthy** — this is people's careers/licensing on the line. Current UI reads
   as generic/weak; raise it to a polished, branded product.
2. **Left sidebar navigation** for the authenticated app (see §5) — replacing the current top nav.
3. **Strong, considered components** — cards, tables, forms, the exam/test UI, dashboards must feel
   deliberate and cohesive, not default.
4. **Focus mode for exams** — the timed exam experience should feel like a real CBT: distraction-free,
   with a prominent timer.
5. **Fully responsive** and **accessible (WCAG 2.1 AA)** — light and dark themes.

## 4. Brand & visual identity
- **Primary color:** a medical **teal/green-teal** (current build uses teal ~`oklch(0.52 0.09 196)`).
  Refine into a full palette; propose an accent and a **success/pass** green and **error/fail** red
  (used heavily in test results). Keep medical connotations (clean, clinical, calm).
- **Neutrals:** a refined gray scale for backgrounds, borders, text (3 text weights min).
- **Typography:** one modern, highly legible sans (e.g. Inter/Geist/Plus Jakarta) — define a type scale
  (display, h1–h4, body, small, caption) with weights. Numbers/timers should be tabular.
- **Iconography:** **lucide** icon set (that's what we use) — consistent stroke weight.
- **Imagery:** course thumbnails, subtle medical motifs; avoid cheesy stock. Provide a tasteful
  default/placeholder for courses without thumbnails.
- **Corner radius, shadows, spacing:** define a consistent scale (we already use an 8px-ish rhythm and
  ~0.6rem radius — refine). Shadows subtle.
- **Deliver design tokens** (color, spacing, radius, typography, shadow) as CSS variables that map to
  Tailwind v4 / shadcn theme variables (`--primary`, `--background`, `--card`, `--muted`, `--ring`,
  `--success`, etc.) in **both light and dark**.

## 5. Layout system (IMPORTANT — structural change)
### 5.1 Authenticated app shell → **left sidebar**
- **Left sidebar** (persistent on desktop, collapsible to icons; off-canvas drawer on mobile) holding
  the role's primary navigation, the MedicHub logo at top, and the user/account area at the bottom.
- **Top bar** (slim): page title/breadcrumb, global actions, subscription status pill (student),
  theme toggle, and the account menu (or keep account at sidebar bottom — designer's call, be consistent).
- **Content area:** generous max-width, clear page header (title + description + primary action), then content.
- Sidebar nav is **role-specific**:
  - **Student:** Dashboard, Browse Courses, My Courses, Mock Exams, Subscription, (Account).
  - **Instructor:** Dashboard, My Courses, Mock Exams, Q&A, (Account).
  - **Admin:** Dashboard, Accounts, Mock Exams, Plan, Settings, (Account).
- Show **active state** clearly; support a collapsed/icon-only mode with tooltips.

### 5.2 Public / marketing layout
- Top nav (logo + Sign in / Get started). Landing page with hero, stats/social proof, feature
  highlights, "how it works", course catalog, testimonials, footer. (Benchmark: acemedixacademy.com.)

### 5.3 Auth layout
- Centered card on a branded background: Login, Register (Student/Instructor toggle), Forgot/Reset password.

## 6. Component system (define all; the ones marked ⚠ currently look weak)
- **Buttons** (primary/secondary/outline/ghost/destructive; sizes; loading state).
- ⚠ **Cards** — course cards (thumbnail, title, instructor, topic count, progress), stat/KPI tiles,
  content cards. Make them distinctive and consistent.
- ⚠ **Data tables** (admin accounts, lists) — headers, row hover, badges, row actions, pagination, empty state.
- **Forms & inputs** — text, textarea, number, **select/dropdown**, **radio group**, **checkbox group**,
  file upload/dropzone, labels, help text, inline validation errors.
- **Badges/pills** — status (Published/Draft, Active/Disabled, Passed/Failed, Correct/Wrong, Answered/Unanswered),
  subscription status.
- **Dialogs/modals**, **dropdown menus**, **tabs**, **tooltips**, **toasts** (success/error).
- **Progress** — linear progress bars (course completion %), circular/score rings.
- **Empty states**, **loading skeletons**, **error states** — designed, not afterthoughts.
- **Charts** — revenue over time (line/bar), for the admin dashboard (day/week/month).
- **Avatar / user menu.**
- **Countdown timer** component (prominent, changes color as time runs low).

## 7. Screen inventory (design all of these)
**Public:** Landing/home, Course catalog, Course preview (detail + topic list), Pricing.
**Auth:** Login, Register, Forgot password, Reset password.
**Student:** Dashboard (KPIs + subscription CTA), Browse courses, My courses (with progress), **Course
player** (video area + topic sidebar + materials + tests + Q&A), **Course test taking** + results +
attempt history, **Mock Exams list**, **Mock exam intro/start screen**, **Mock exam running (timed)**,
**Mock exam results**, Subscription/checkout, Account settings.
**Instructor:** Dashboard (KPIs), Courses list, **Course manage** (tabs: Topics / Materials / Tests;
thumbnail upload; video upload), Test authoring (questions + options), **Mock Exams list + authoring**,
Q&A inbox (with reply), Account settings.
**Admin:** Dashboard (platform KPIs + revenue chart), Accounts (searchable table + enable/disable),
Mock Exams (manage all), Subscription plan editor, Platform settings, Account settings.

## 8. Key interaction patterns to get right
- ⚠ **Question authoring — correct-answer affordance:**
  - **Single choice** and **True/False** → options rendered as a **radio group**: exactly **one**
    correct answer selectable. (Current build wrongly allows multiple — fix in design *and* code.)
  - **Multiple choice** → **checkbox group**: one or more correct answers.
  - The editor UI must switch the correct-answer control based on the chosen question type.
- **Test/exam taking (student):** one clear question card at a time or a clean scrollable list; selected
  option obvious; **single-answer questions = radios**, multi = checkboxes; sticky submit; on submit show
  score, pass/fail, and per-question correct/wrong review.
- **Timed mock exam:** distraction-reduced "focus" layout; **prominent sticky countdown** that turns
  amber/red near the end; auto-submit at zero with a clear message; a start screen showing duration,
  question count, pass mark, and past best score.
- **Progress:** course completion shown as a progress bar + "x/N topics"; completed topics visibly green.
- **Subscription/paywall:** clean gate — when a non-subscriber hits gated content, a well-designed
  "Subscribe to unlock" state (not an error). Pricing card(s) with a clear CTA; "most popular/best value"
  badges supported for future multi-plan.
- **Uploads:** dropzone pattern for thumbnails (image preview) and materials (file list).

## 9. States, responsive, accessibility
- Every list/data view needs **loading (skeleton)**, **empty**, and **error** designs.
- **Responsive:** design desktop + mobile for every screen; sidebar collapses to a drawer; tables become
  stacked cards on mobile; the exam UI must work well on phones.
- **Dark mode:** full parity (we support light/dark via theme tokens).
- **Accessibility:** WCAG 2.1 AA — color contrast, visible focus rings, keyboard nav, adequate touch
  targets, labels on all inputs, timer announced to screen readers.

## 10. Technical constraints (design to be buildable)
- Implemented in **React + Tailwind CSS v4 + shadcn/ui (Radix primitives) + lucide icons**. Prefer
  patterns those support; deliver **design tokens as CSS variables** matching the shadcn theme contract
  (`--background --foreground --card --primary --secondary --muted --accent --destructive --border
  --input --ring --success --radius` etc., light + dark).
- **Money is Naira (₦)** — show prices as ₦ (e.g. ₦10,000/month).
- Keep it **self-hostable / no heavy custom canvas**; standard web components.

## 11. Deliverables (from the designer)
1. **Design system / foundations:** color palette (light+dark) with tokens, typography scale,
   spacing/radius/shadow scales, iconography guidance.
2. **Component library:** all components in §6 with states (default/hover/active/disabled/loading/error).
3. **High-fidelity screens:** all of §7, desktop **and** mobile, in light **and** dark (at least the key
   flows in both themes).
4. **Key flows as click-throughs:** subscribe→checkout, take a timed mock exam, author a test/mock,
   admin manage accounts.
5. Delivered in **Figma** (components + tokens + screens), with a short usage note mapping tokens to the
   shadcn variables.

## 12. Reference
- **Primary reference (to be supplied):** `<PASTE THE REFERENCE SITE URL HERE>` — match/beat its polish
  and structure (especially the left-sidebar app + exam UI).
- **Domain analog:** acemedixacademy.com (Nigerian MDCN exam prep) — good for feature framing, catalog,
  pricing, and social-proof patterns.
- Keep MedicHub's own identity (teal, medical, trustworthy) — inspiration, not imitation.

## 13. Out of scope (for now)
Image-based/"picture test" questions, free-text/essay grading, certificates, multi-tier plans, the
native mobile app. Design should not preclude these later.
