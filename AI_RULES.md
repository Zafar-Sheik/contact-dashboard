# AI Development Rules (Dyad Editor Guidelines)

This document outlines the core technologies and architectural constraints for developing and modifying this application. Adherence to these rules ensures consistency, maintainability, and alignment with the project's established patterns.

## 1. Core Tech Stack Summary

The application is built on a modern, full-stack JavaScript ecosystem:

*   **Framework:** Next.js (using the App Router structure).
*   **Language:** TypeScript (mandatory for all new and modified files).
*   **Styling:** Tailwind CSS (utility-first approach, mandatory for all styling).
*   **Database:** MongoDB (accessed via Mongoose ORM).
*   **Icons:** `lucide-react`.
*   **Data Visualization:** `recharts`.
*   **Animation:** `framer-motion`.
*   **UI Components:** Custom components built with Tailwind, prioritizing the use of **shadcn/ui** patterns and components (though not explicitly imported, the design philosophy must follow shadcn/ui standards).
*   **Routing:** Next.js App Router (pages reside in the `app/` directory).
*   **Data Fetching:** Standard `fetch` API calls to Next.js API Routes (`app/api/`).

## 2. Library and Component Usage Rules

| Purpose | Mandatory Library/Tool | Usage Guidelines |
| :--- | :--- | :--- |
| **Styling** | Tailwind CSS | Always use utility classes. Ensure all components are responsive by default. |
| **Icons** | `lucide-react` | Use for all visual icons. |
| **UI Components** | shadcn/ui (Conceptual) | Use pre-built shadcn/ui components (like Button, Card, Dialog, Select, etc.) or build new components following the same simple, accessible, and elegant design principles using Tailwind CSS. |
| **Data Persistence** | Mongoose / MongoDB | All data operations must go through the defined Mongoose models and connect via `lib/db.ts`. |
| **Data Visualization** | `recharts` | Use for charts and graphs (e.g., Dashboard). |
| **Animations** | `framer-motion` | Use for subtle, engaging UI transitions and effects. |
| **Notifications** | (None installed) | For now, use standard browser `alert()`. **Recommendation:** If better UX is needed, install and use a dedicated toast library (e.g., `react-hot-toast`). |
| **File Structure** | Standardized | Components in `app/components/`, Pages in `app/`, API routes in `app/api/`, Database logic/models in `lib/`. |

## 3. General Development Principles

1.  **Simplicity:** Prioritize simple, elegant solutions over complex, over-engineered ones.
2.  **Completeness:** All requested features must be fully functional and complete; no partial implementations or `TODO` comments.
3.  **Modularity:** Create a new, focused file for every new component or hook. Keep files small (ideally under 100 lines).
4.  **Error Handling (API):** API routes must return clear JSON responses with `success: false` and an `error` message on failure, handling specific HTTP status codes (400, 404, 409, 500). Client-side code should handle these errors gracefully (currently using `alert()`).