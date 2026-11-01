# Refero Design System Specification
## Concept: VERCEL ENGINEERING INTERFACE × AI MISSION CONTROL

> **Reference Source**: [Refero Design Style f24daf3a-d43f-4dec-85a9-8ac1d5148a03](https://styles.refero.design/style/f24daf3a-d43f-4dec-85a9-8ac1d5148a03)  
> **Target Application**: AI Command Center (Open-Source Multi-Agent Orchestrator)

---

## 1. Design Principles

1. **Light Minimalist Engineering Environment**:
   - The workspace is engineered for clarity, readability, and continuous monitoring.
   - Clean, near-white paper surfaces (`#FAFAFA` and `#FFFFFF`) eliminate visual fatigue.
   - Contrast is driven by precise typographic weight rather than heavy background fills.

2. **Content-First Hierarchy**:
   - Color is functional, never decorative. It must never compete with the content.
   - Status indicators rely on unambiguous text labels and iconography, supplemented by restrained status tints.

3. **Hairline Precision**:
   - Replace heavy dropshadows and dark glossy glass with crisp 1px hairline borders (`#EBEBEB`).
   - Cards, tables, and inspection panes share a strict 6px border radius.

4. **Dense Information Architecture**:
   - Avoid oversized marketing cards designed to fill whitespace.
   - Utilize structured data tables, compact metadata badges, and split-screen inspector panels.

---

## 2. Color Palette & Functional Tokens

### 2.1 Grayscale & Theme System

The design system supports both **Light Mode (Paper White)** and **Dark Mode (Obsidian Dark)** using identical geometric density and hairline rules.

#### Light Theme (Default Canvas: #FAFAFA)
| Token Name | Hex Code | Role / Usage | WCAG Contrast |
|------------|----------|--------------|---------------|
| **Paper White** | `#FAFAFA` | Canvas background | 1.0:1 (Base) |
| **Pure White** | `#FFFFFF` | Card surfaces, tables, modals | 1.05:1 |
| **Obsidian** | `#171717` | High-emphasis headers, active tabs | **18.2:1 (AAA Pass)** |
| **Charcoal** | `#4D4D4D` | Body text, table cells | **9.1:1 (AAA Pass)** |
| **Stone** | `#666666` | Secondary captions, tags | **6.1:1 (AA Pass)** |
| **Slate** | `#7D7D7D` | Metadata, timestamps | **4.6:1 (AA Pass)** |
| **Hairline** | `#EBEBEB` | Component borders, table dividers | 1.2:1 |

#### Dark Theme (Canvas: #0A0A0A)
| Token Name | Hex Code | Role / Usage | WCAG Contrast |
|------------|----------|--------------|---------------|
| **Obsidian Canvas** | `#0A0A0A` | Canvas background | 1.0:1 (Base) |
| **Elevated Card** | `#121212` | Card surfaces, tables, modals | 1.1:1 |
| **Surface Subtle** | `#1C1C1C` | Hover states, tab backgrounds | 1.3:1 |
| **Text Primary** | `#EDEDED` | Headers, active values, high emphasis | **17.5:1 (AAA Pass)** |
| **Text Secondary** | `#A1A1A1` | Body text, descriptions | **7.5:1 (AAA Pass)** |
| **Text Muted** | `#737373` | Metadata, captions, timestamps | **4.6:1 (AA Pass)** |
| **Dark Hairline** | `#262626` | Component borders, table dividers | 1.4:1 |

### 2.2 Functional Status Tokens
Status tokens are muted and always paired with textual state:
- **Terminal Green (Active / Success)**: `#297A3A`  
  - Background: `#F4FBF6` | Border: `#D3F0DC` | Text: `#297A3A`
- **Amber (Warning / High Load / In Review)**: `#A16207`  
  - Background: `#FEFCE8` | Border: `#FEF08A` | Text: `#A16207`
- **Crimson (Failed / Timeout / Alert)**: `#B91C1C`  
  - Background: `#FEF2F2` | Border: `#FECACA` | Text: `#B91C1C`
- **Technical Blue (Info / In Progress / Starting)**: `#1D4ED8`  
  - Background: `#EFF6FF` | Border: `#BFDBFE` | Text: `#1D4ED8`
- **Argon Purple (L4 Escalation / Deep Reasoning)**: `#7E22CE`  
  - Background: `#FAF5FF` | Border: `#E9D5FF` | Text: `#7E22CE`

---

## 3. Typography Specification

### 3.1 Font Stacks
- **Interface / Proportional**: `Geist Sans`, `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Engineering / Monospace**: `Geist Mono`, `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace`

### 3.2 Scale & Hierarchy
- **Header 1 (Page Title)**: `18px` (`text-lg`), SemiBold (600), tracking `-0.02em`, Obsidian.
- **Header 2 (Section Title)**: `14px` (`text-sm`), SemiBold (600), tracking `-0.01em`, Obsidian.
- **Body Regular**: `13px` (`text-[13px]`), Regular (400), leading `1.5`, Charcoal.
- **Caption / Meta**: `11px` (`text-[11px]`), Medium (500), tracking `0.01em`, Stone / Slate.
- **Mono Technical / Code**: `12px` (`text-xs`), Geist Mono, Obsidian / Charcoal.

---

## 4. Spacing, Geometry & Radii

- **Grid Unit**: 4px base (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
- **Border Radius**:
  - Buttons, inputs, pills, dropdowns: **6px** (`rounded-md`).
  - Cards, tables, inspectors: **6px** (`rounded-md`).
  - Outer modals / sheets: **8px** (`rounded-lg`).
- **Dividers**: Hairline solid 1px (`border-[#EBEBEB]`).
- **Elevation**: Minimalist subtle shadow (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04)`).

---

## 5. Prohibited Visual Patterns

1. ❌ **No Heavy SaaS Glows**: No colored neon glows, oversaturated blur backdrops, or floating particle gradients.
2. ❌ **No Random Gradients**: Avoid multi-color decorative gradients behind charts or headers.
3. ❌ **No Giant Empty Cards**: Don't use 200px tall empty boxes to hold 2 lines of text.
4. ❌ **No Color-Only State**: Never indicate status solely by a colored dot without an accessible text label or icon.
5. ❌ **No Slow Animations**: All UI feedback transitions must complete within 150ms–200ms with snappy easing.
