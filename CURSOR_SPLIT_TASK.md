# Cursor Task: Split NexusOS into Separate Module Files

## This monorepo (Rick’s Desktop `nexus`)

- **Shell file**: `src/components/NexusOS.tsx` (TypeScript, ~1700 lines; same UI as the zip’s `NexusOS.jsx`).
- **API routes**: live under **`app/api/`** at the project root (not `src/app/api/`).
- **Reference snapshot**: `artifacts/nexus-os-v5.zip` (copy of `Downloads/nexus-os (5).zip`) and extracted tree at `artifacts/nexus-os-v5-extracted/nexus-os/` — includes `src/components/ui/tokens.js` and Clerk `middleware.ts` from the zip layout for comparison only.

Use **`.tsx`** for new files in this repo unless you prefer `.jsx`. Imports and logic stay the same as in the steps below.

## Overview

Split the large NexusOS file into clean files following the structure below. Every file should import the shared design tokens and UI components. The main `NexusOS.tsx` becomes a thin shell that imports and renders modules.

## Target File Structure

```
src/components/
├── NexusOS.tsx              ← Thin shell: sidebar, top bar, routing, HA connection logic
├── ui/
│   ├── tokens.ts            ← Design tokens (T object) — extract from NexusOS or copy from artifacts zip
│   ├── Card.tsx             ← Card, Badge, StatCard, SectionHeader
│   └── EntityCard.tsx       ← EntityCard + SceneCard
├── modules/
│   ├── HomeModule.tsx       ← Home tab (entity grid, scenes, area filter, stats)
│   ├── EnergyModule.tsx     ← Energy tab (chart, device breakdown, stats)
│   ├── CamerasModule.tsx    ← Cameras tab (camera grid, event timeline)
│   ├── AutomationsModule.tsx ← Automations tab (list, toggle, builder)
│   └── SystemModule.tsx     ← System tab (health check, service status, hardware)
├── overlays/
│   ├── AgentBay.tsx         ← Agent Bay slide-over chat panel
│   └── CommandPalette.tsx   ← ⌘K command palette modal
```

## Step-by-Step Instructions

### 1. `src/components/ui/tokens.ts`

Export the `T` object (bg, border, text, accent, font tokens). In this repo it is still inline inside `NexusOS.tsx` — extract it here first. You can also reference `artifacts/nexus-os-v5-extracted/nexus-os/src/components/ui/tokens.js` from the v5 zip snapshot.

---

### 2. Create `src/components/ui/Card.tsx`

Extract these 4 components from `NexusOS.tsx`:
- `Card` (line ~147) — the card wrapper with hover effects
- `Badge` (line ~174) — colored badge pill
- `StatCard` (line ~183) — stat card with icon, value, trend
- `SectionHeader` (line ~204) — section title + subtitle + action slot

```jsx
"use client";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { T } from "./tokens";

// Paste Card, Badge, StatCard, SectionHeader here
// Export all as named exports:
export { Card, Badge, StatCard, SectionHeader };
```

---

### 3. Create `src/components/ui/EntityCard.tsx`

Extract:
- `EntityCard` (line ~216) — the toggleable device card
- `SceneCard` (line ~301) — the quick action scene button

These need several lucide icons. Import only what they use.

```jsx
"use client";
import { useState } from "react";
import { Lightbulb, Thermometer, Lock, Unlock, Fan, /* etc */ } from "lucide-react";
import { T } from "./tokens";
import { Card, Badge } from "./Card";

// Paste EntityCard and SceneCard here
export { EntityCard, SceneCard };
```

---

### 4. Create `src/components/modules/HomeModule.tsx`

Extract the `HomeModule` component (starts at `const HomeModule = ({`).

It needs:
- `useState, useEffect` from react
- Several lucide icons (Lightbulb, Thermometer, SunMedium, Shield, Moon, Video, Eye, Wind, Flame)
- `{ T }` from `../ui/tokens`
- `{ Card, StatCard, SectionHeader }` from `../ui/Card`
- `{ EntityCard, SceneCard }` from `../ui/EntityCard`
- The `MOCK_AREAS`, `MOCK_SCENES`, and `MOCK_ENTITIES` arrays — move these into a new file `src/components/data/mockData.js` or put them at the top of HomeModule.

```jsx
"use client";
export default function HomeModule({ entities, onToggle, onActivateScene, areas }) {
  // ... paste the full HomeModule body
}
```

---

### 5. Create `src/components/modules/EnergyModule.tsx`

Extract the `EnergyModule` component.

It needs:
- `useState, useEffect, useMemo` from react
- `{ AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid }` from recharts
- Several lucide icons (Zap, SunMedium, Plug, TrendingDown, Thermometer, Droplets, Flame, Lightbulb)
- `{ T }` from `../ui/tokens`
- `{ Card, StatCard, SectionHeader }` from `../ui/Card`
- The `ENERGY_DATA` and `ENERGY_DEVICES` mock arrays — include at top of file or import from mockData

```jsx
"use client";
export default function EnergyModule() {
  // ... paste the full EnergyModule body
}
```

---

### 6. Create `src/components/modules/CamerasModule.tsx`

Extract the `CamerasModule` component.

It needs:
- `useState, useEffect` from react
- Lucide icons: Cctv, Eye, Database
- `{ T }` from `../ui/tokens`
- `{ Card, Badge, StatCard, SectionHeader }` from `../ui/Card`
- The `MOCK_CAMERAS` array

```jsx
"use client";
export default function CamerasModule() {
  // ... paste the full CamerasModule body
}
```

---

### 7. Create `src/components/modules/AutomationsModule.tsx`

Extract the `AutomationsModule` component.

It needs:
- `useState, useEffect` from react
- Lucide icons: Zap, Shield, Play, Plus, Clock, ChevronRight, ToggleRight, ToggleLeft
- `{ T }` from `../ui/tokens`
- `{ Card, Badge, SectionHeader }` from `../ui/Card`
- The `MOCK_AUTOMATIONS` array

```jsx
"use client";
export default function AutomationsModule() {
  // ... paste the full AutomationsModule body
}
```

---

### 8. Create `src/components/modules/SystemModule.tsx`

Extract the `SystemModule` component.

It needs:
- `useState, useEffect` from react
- Lucide icons: Home, Cctv, Router, Bot, Sparkles, GitBranch, Globe, CircleDot, Cpu, Layers, Database, Clock
- `{ T }` from `../ui/tokens`
- `{ Card, Badge, StatCard, SectionHeader }` from `../ui/Card`

```jsx
"use client";
export default function SystemModule({ haConnected, haError, onRefresh }) {
  // ... paste the full SystemModule body
}
```

---

### 9. Create `src/components/overlays/AgentBay.tsx`

Extract the `AgentBay` component (the slide-over chat panel).

It needs:
- `useState, useEffect, useRef` from react
- Lucide icons: Bot, X, Send
- `{ T }` from `../ui/tokens`

```jsx
"use client";
export default function AgentBay({ isOpen, onClose }) {
  // ... paste the full AgentBay body
}
```

---

### 10. Create `src/components/overlays/CommandPalette.tsx`

Extract the `CommandPalette` component (the ⌘K modal).

It needs:
- `useState, useEffect, useRef` from react
- Lucide icons: Home, Zap, Camera, Workflow, Settings, Search, Lightbulb, Lock, Moon, Bot
- `{ T }` from `../ui/tokens`
- `{ Badge }` from `../ui/Card`

```jsx
"use client";
export default function CommandPalette({ isOpen, onClose, onNavigate, onAgentCommand }) {
  // ... paste the full CommandPalette body
}
```

---

### 11. Rewrite `src/components/NexusOS.tsx` as the thin shell

After extracting everything, `NexusOS.tsx` should be ~200 lines:

```jsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Home, Zap, Camera, Settings, Search, Bell, Bot, Workflow,
  PanelLeftClose, PanelLeft, AlertTriangle, Info, X
} from "lucide-react";
import { T } from "./ui/tokens";
import { Badge } from "./ui/Card";
import HomeModule from "./modules/HomeModule";
import EnergyModule from "./modules/EnergyModule";
import CamerasModule from "./modules/CamerasModule";
import AutomationsModule from "./modules/AutomationsModule";
import SystemModule from "./modules/SystemModule";
import AgentBay from "./overlays/AgentBay";
import CommandPalette from "./overlays/CommandPalette";

// Keep in NexusOS.tsx:
// - MODULES array (sidebar nav config)
// - The default export function NexusOS()
// - All the HA connection/streaming logic (useEffect with EventSource)
// - The notification state + addNotification function
// - toggleHA and activateScene callbacks
// - derivedAreas useMemo
// - The sidebar, top bar, and module routing (renderModule switch)
// - The notification toast rendering
// - The global <style> tag with fonts + animations
```

---

## Rules

1. **Every file gets `"use client"` at the top** — these are all client components.
2. **Import `T` from `../ui/tokens`** (or `./ui/tokens` from `NexusOS.tsx` level) — never copy the tokens object.
3. **Named exports for ui components** (`export { Card, Badge }`), **default exports for modules** (`export default function HomeModule`).
4. **Don't change any logic, styling, or behavior** — this is purely a file reorganization.
5. **Mock data arrays** (MOCK_ENTITIES, MOCK_AREAS, MOCK_SCENES, MOCK_CAMERAS, MOCK_AUTOMATIONS, ENERGY_DATA, ENERGY_DEVICES) can either live at the top of their respective module files, or be centralized in `src/components/data/mockData.js` and imported. Either works — pick one and be consistent.
6. **The `<style>` tag with font imports and keyframes** stays in `NexusOS.tsx` since it's global.
7. **Test that `npm run dev` still works after splitting** — no broken imports.

## Verification

After splitting, run:
```bash
npm run dev
```

Open http://localhost:3000/os and verify:
- All 5 module tabs render correctly
- ⌘K opens command palette
- ⌘J opens Agent Bay
- Entity cards are toggleable
- Scene cards are tappable
- Notification toasts still appear (toggle a light to test)
- Top bar shows correct HA connection status
