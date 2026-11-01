# Refero Component Guidelines & Patterns

> **Design Style**: Vercel Engineering Interface × AI Mission Control  
> **Tokens Source**: [design/tokens.css](tokens.css)

---

## 1. Action Buttons (`Button`)

All buttons share a strict `6px` radius (`rounded-md`), crisp typography, and explicit interactive states (`hover`, `active`, `focus-visible`, `disabled`).

### 1.1 Primary Button
- **Background**: Obsidian `#171717` (hover: `#2E2E2E`, active: `#000000`)
- **Text**: Pure White `#FFFFFF`, `13px`, medium (500)
- **Border**: 1px solid `#171717`
- **Focus**: `focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2`
- **Use Case**: Primary call-to-action ("New Task", "Execute CLI", "Save Configuration")

### 1.2 Secondary / Neutral Button
- **Background**: Pure White `#FFFFFF` (hover: `#F5F5F5`, active: `#EAEAEA`)
- **Text**: Obsidian `#171717`, `13px`, medium (500)
- **Border**: 1px solid `#EBEBEB` (hover: `#C9C9C9`)
- **Use Case**: Filtering, cancellation, modal dismissal, secondary tools

### 1.3 Danger Button
- **Background**: Pure White `#FFFFFF` (hover: `#FEF2F2`)
- **Text**: Crimson `#B91C1C`, `13px`, medium (500)
- **Border**: 1px solid `#FECACA` (hover: `#F87171`)
- **Use Case**: Task cancellation, emergency supervisor stop, process tree kill

---

## 2. Technical Badges & Status Pills

Badges use Geist Mono (`text-xs`), compact padding (`px-2 py-0.5`), and explicit borders:

### 2.1 Live Antigravity Connection
```html
<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-[#F4FBF6] text-[#297A3A] border border-[#D3F0DC]">
  <span class="w-1.5 h-1.5 rounded-full bg-[#297A3A]"></span>
  ONLINE
</span>
```

### 2.2 Provenance Indicators (Data Transparency)
- **Verified Live**:
  ```html
  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#F4FBF6] text-[#297A3A] border border-[#D3F0DC]">
    LIVE
  </span>
  ```
- **Estimated Metric**:
  ```html
  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
    ESTIMATE
  </span>
  ```
- **Demo / Mock Seed**:
  ```html
  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A]">
    DEMO
  </span>
  ```

---

## 3. Data Tables & Lists

Tables serve as the primary layout structure for Tasks, Events, and Agent registries:
- **Table Container**: Pure White `#FFFFFF`, border `1px solid #EBEBEB`, `rounded-md`.
- **Table Header**: Background `#FAFAFA`, text `Stone #666666`, font `Geist Sans`, `11px`, uppercase, medium tracking (`tracking-wider`).
- **Table Row**: Height `40px`–`48px`, border bottom `1px solid #EBEBEB`, hover state `hover:bg-[#F5F5F5]`.
- **Cells**: Font `13px` Charcoal `#4D4D4D`, numbers and IDs in `Geist Mono`.

---

## 4. Input Fields & Search Bars

- **Background**: Pure White `#FFFFFF`
- **Border**: `1px solid #EBEBEB` (focus: `#171717`)
- **Text**: Obsidian `#171717`, placeholder: `Smoke #A8A8A8`
- **Radius**: `6px` (`rounded-md`)
- **Focus Ring**: `focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]`

---

## 5. Modal Sheets & Drawers

- **Backdrop**: Translucent Obsidian `rgba(23, 23, 23, 0.4)` with light blur (`backdrop-blur-sm`).
- **Surface**: Pure White `#FFFFFF`, border `1px solid #EBEBEB`, radius `8px` (`rounded-lg`), subtle shadow `var(--shadow-modal)`.
- **Header**: Height `52px`, border bottom `1px solid #EBEBEB`, title `14px SemiBold`, close button with `focus-visible`.
- **Keyboard**: Full `Escape` listener and focus trap.
