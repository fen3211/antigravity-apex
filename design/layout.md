# Refero Layout & Responsive Architecture

> **Design Style**: Vercel Engineering Interface × AI Mission Control  
> **Tokens Source**: [design/tokens.css](tokens.css)

---

## 1. Application Layout Shell

The layout consists of a fixed engineering header, a persistent side navigation rail (with mobile drawer), and a primary workspace area.

```
+---------------------------------------------------------------------------------+
| Header: Brand Logo | Environment Status | Live Agys | Active Tasks | + New Task  |
+---------------------+-----------------------------------------------------------+
| Sidebar Nav (220px) | Main Content Workspace (Paper White #FAFAFA)              |
| - Mission Control   |                                                           |
| - Agents (17)       | [Section Header / Filter Bar]                             |
| - Tasks             | +-------------------------------------------------------+ |
| - Orchestration     | | Data Table / Inspection Grid (Pure White #FFFFFF)     | |
| - Analytics         | |                                                       | |
| - Memory            | +-------------------------------------------------------+ |
| - Events            |                                                           |
+---------------------+-----------------------------------------------------------+
```

---

## 2. Responsive Breakpoint Matrix

| Breakpoint | Target Screen | Layout Behavior |
|------------|---------------|-----------------|
| **`>= 1440px`** | Large Desktop / 2K | Full 2-column inspector, persistent 220px sidebar, expanded metrics table |
| **`1280px`** | Standard Laptop | Persistent 220px sidebar, balanced density, table horizontal scroll containment |
| **`1024px`** | Tablet Landscape | Sidebar collapses into compact icon rail or slide-out drawer |
| **`768px`** | Tablet Portrait | Mobile top bar with hamburger toggle, drawer navigation, stacked forms |
| **`390px`** | Mobile Device | Full-width cards, drawer navigation, scrollable table containers with zero horizontal page overflow |

---

## 3. Ergonomics & Density Standards

- **Horizontal Zero-Overflow Invariant**:
  The global body container enforces `overflow-x: hidden`. Tables and code blocks feature dedicated local horizontal scroll containers (`overflow-x-auto`) with thin webkit scrollbars.
- **Touch Target Invariant**:
  All interactive controls (buttons, links, tab items, hamburger menu) maintain a minimum accessible hit area of **44×44px** on mobile viewports (`min-h-[44px] min-w-[44px]`).
- **Focus Ring Invariant**:
  All focusable elements support `:focus-visible` styling (`ring-2 ring-[#171717] ring-offset-2`).
