# Grid Crisis Response — Game Concept

> **Vision:** A living grid that demands ongoing management, told through the eyes of a real engineer navigating real crises. Learning = earning power. Power = decisions. Decisions have consequences. Every incident has a story.

---

## Decisions Locked In

| Question | Decision |
|---|---|
| Passive vs. active degradation | **Passive** — real-time clock-based. Incidents trigger while you're away. Push notifications bring you back. |
| Incident triggers | **Dual-source** — passive time-based (18–36h per asset) + activity-triggered (finishing a module/mission can trigger a thematically linked incident). Keeps it unpredictable. |
| Blackout consequence | **Always recoverable** — but with serious, escalating consequences (kWh debt, region darkness, score penalty) |
| Regional expansion | **Yes** — 5-region campaign structure confirmed |
| Narrative layer | **Yes** — Quest-story system with a narrator, pop-up dialogues, embedded concept explanations |
| Dispatch Call triggers | **Automatic** — pop up on first entry to a region, no manual unlock needed |
| Visual style | **2D grid world + 3D characters** — Grid is 2D animated (readable, achievable, beautiful). 3D is reserved for the Dispatcher and the user's character where emotional impact matters most. |
| Character system | **RPG character screen** — fixed stylized engineer figure (no customisation at signup), levels, titles, and unlockable equipment cosmetics earned through play. |
| First region | **Lithuania** — BRELL desynchronisation narrative. Geopolitically real, technically rich, dramatically compelling. |
| Grid infrastructure model | **Real voltage hierarchy** — 330kV transmission → 110kV sub-transmission → 35kV regional → 10kV urban distribution → 0.4kV service points. Same structure for all regions, adapted for local context. |

---

## The Problem with the Current System

| What exists | Why it falls short |
|---|---|
| Deploy 9 assets in linear order | No meaningful decisions — path is predetermined |
| Events apply stat penalties | Events are cosmetic — nothing bad actually happens |
| Reach 110% stability → done | No reason to return after full deployment |
| kWh earned but never threatened | No tension — you can't lose what you've built |
| No narrative | The grid feels like a dashboard, not a world |

**Root issue:** There are no stakes, no story, no reason to care.

---

## Core Game Loop (Redesigned)

```
LEARN → EARN kWh → DEPLOY assets → MANAGE incidents → DEFEND regions → EXPAND to new grids
  ↑                                      ↑                                        |
  |                               passive time passes                             |
  └──────────────── keep earning to repair, unlock, and progress ────────────────┘
```

Four pillars:
1. **Build** — Deploy infrastructure to stabilize the grid
2. **Defend** — Respond to passive incidents that degrade your assets over time
3. **Expand** — Unlock new regional grids with unique challenges
4. **Experience** — A narrator-driven quest-story that makes every action feel meaningful

---

## Visual Style — 2D World, 3D Characters

### The split
**Grid world → 2D.** Readable, achievable, beautiful when done well. Energy flows, node states, region atmospheres — all handled through canvas animation, CSS, and SVG. No Three.js dependency for the map.

**Characters → 3D.** The Dispatcher and the user's own character are where 3D has real emotional impact. A rotating 3D figure on your profile page that levels up and changes visually as you progress is something you care about. A 3D map you can't control feels like a screensaver. The distinction is: *3D where you feel ownership, 2D where you need clarity.*

This is exactly how RuneScape works. The world is navigable top-down. Your character is the thing you're emotionally invested in.

### 2D Grid — what changes from the current map
The `GridMapCanvas` already exists as a 2D canvas. The job is to make it feel alive rather than diagrammatic.

Five things that separate a game world from a diagram:
1. **The environment reflects game state** — at 38% stability the scene is dark, damaged, ominous. At 110% it blazes. Nothing looks the same at failure and at victory.
2. **Energy flows visibly** — connections carry animated particles, not just lines. Power moves through the grid. You see it.
3. **Assets have idle micro-animations** — blinking status lights, pulsing rings, rotating indicators. The world breathes.
4. **Deploy moments are events** — a shockwave pulse radiates outward from a newly deployed node. A consequence happens visually.
5. **The ground is a world** — dark circuit-board terrain with category-colored glow zones, not a flat rectangle.

### Scene redesign spec

**Ground / terrain:**
- Replace flat green with dark near-black terrain (`#0D1117`) with glowing circuit-board grid lines etched in (`#1A2A1A` for grid lines, category color glow for active zones)
- Subtle height variation — not perfectly flat. Low ridges separate regions.
- Active regions have a faint atmospheric glow above them (stability-colored)
- Inactive / locked regions: grey, muted, slightly darker

**Sky / environment:**
- Dark atmospheric background — not void black, something like deep navy with subtle horizon glow
- Event-reactive: Cloud Cover event adds volumetric cloud layer drifting across the scene; Evening Peak adds warm orange glow from the horizon; Wind Ramp adds streaking motion in the atmosphere
- This means the environment *is* the event ticker — you see what's happening without reading it

**Asset models — idle animation layer:**

| Asset | Idle animation |
|---|---|
| Control Center | Slow antenna rotation, periodic radar sweep ring |
| Smart Transformer | Electrical arc pulses between coils (subtle) |
| Solar Forecasting Array | Dish tilts slowly tracking "sun" direction |
| Battery Storage | Charge indicator bar pulses up and down |
| Frequency Controller | Oscilloscope-style wave on a small display surface |
| Demand Response System | Data flow particles streaming into/out of the node |
| Grid Flywheel | Visible flywheel disk spinning — speed reflects grid frequency |
| HVDC Interconnector | Current flow lines animate along the tower structure |
| AI Grid Optimizer | Pulsing neural network pattern on the casing |

**Connection edges:**
- Not lines — **energy channels** with traveling particles
- Particle speed and density reflect connection health and load
- Color follows the source asset's category
- Stressed connections: particles slow and turn amber
- Dead connections: static, grey, no particles
- On milestone cross: a visible pulse wave travels outward from the triggering node along all connected edges

**Stability-driven scene atmosphere:**

| Stability tier | Scene feel |
|---|---|
| Critical (0–25%) | Near-dark. Most nodes unlit. Red emergency lighting on deployed assets. Connections barely flickering. |
| Unstable (25–50%) | Dim amber atmosphere. Assets glow weakly. Connections intermittent. |
| Marginal (50–75%) | Blue-grey. Grid is clearly alive but stressed. Active connections visible. |
| Stable (75–90%) | Clean teal glow. Strong particle flow. Scene feels operational. |
| Optimal (90–110%+) | Scene blazes. Nodes emit full glow. Connections are bright rivers of energy. Atmospheric light above the grid. |

**Deploy animation sequence:**
1. Asset platform rises from below the terrain (0.4s ease-out)
2. Vertical beam of category-colored light hits it from above (0.3s)
3. Asset model materialises within the beam (0.3s, opacity 0 → 1)
4. Shockwave ring pulse radiates from the node outward across the terrain (0.5s)
5. Connected edges animate into life — particles begin traveling (0.6s staggered)
6. Node begins its idle animation

**Incident visual:**
- Affected node's glow flickers and dims progressively
- Connection particles on that node's edges slow
- Warning tier: amber overlay ring around the node, slow pulse
- Critical tier: orange fast pulse, connection particles nearly stopped
- Offline: node goes dark, connected edges go dead grey, a small red distress beacon on the model

**Blackout:**
- Affected region nodes cut to black simultaneously (0.2s)
- Shockwave of darkness radiates outward from the failed node
- Red emergency color bleeds across the region
- Camera auto-tilts slightly toward the region
- Full-screen blackout narrative overlay fades in over the dimmed scene

### Animation principles

| Principle | Rule |
|---|---|
| **State = visual truth** | You should be able to read grid health at a glance without numbers |
| **Every action has a reaction** | Nothing happens silently. Deploy, incident, repair, milestone — all have visible consequences. |
| **Ambient motion everywhere** | Even at rest, the scene moves. Idle animations, particle flows, atmospheric drift. It's alive. |
| **Camera serves drama** | On milestone: slow pull-back. On blackout: tilt toward failure. On deploy: brief push-in. |
| **Performance is non-negotiable** | All animations must run at 60fps. Use instanced meshes, shader-based effects, avoid per-frame geometry rebuilds. |

### 2D grid — technical implementation
- Primary view: enhanced `GridMapCanvas` (existing canvas element)
- Terrain background: dark SVG pattern with circuit-board grid lines, CSS glow on active regions
- Node rendering: canvas circles/shapes with category colors + CSS `box-shadow` bloom effect
- Edge animation: SVG `stroke-dashoffset` animation — traveling dashes simulate energy particles moving through connections
- Node idle animations: CSS keyframe animations on canvas overlays (pulsing rings, blinking indicators)
- Deploy effect: canvas ripple animation radiating from new node + staggered edge particle activation
- Stability atmosphere: CSS background gradient and filter changes mapped to stability tier
- Event atmosphere: overlay layer (cloud texture opacity, warm gradient for Evening Peak) that fades in/out with active events
- All animations target 60fps via `requestAnimationFrame` — no heavy redraws

---

## The Character System — Your Engineer Identity

### Why this matters
In RuneScape, you don't just play a game — you build a character. The rotating figure on the character screen, the level number, the equipment you've unlocked — this is the emotional core of long-term engagement. You come back because *your character* is there. Not the game. Your character.

StableGrid needs the same anchor. The grid is the world. The character is you.

---

### The User's Character

**The profile page becomes an RPG character screen.**

Center of the page: your 3D engineer figure, slowly rotating on a circular platform. Lit dramatically. Around them: your stats, your level, your title, your unlocked equipment.

**Character model:**
- **Fixed stylized figure** — one distinctive engineer character, not customisable at signup. Identity comes from what you earn, not what you choose at the start. Think Hollow Knight or Doomguy: recognisable by posture and gear, not by face.
- Stylized low-poly aesthetic — identifiable as an engineer (hard hat, utility vest, tablet), but angular and stylized rather than photorealistic
- Sits on a dark rotating circular platform, Three.js scene embedded in the profile page
- Platform shows the region patches earned as inlaid icons
- Ambient lighting reacts to level tier: cool blue (Cadet) → operational teal (Engineer) → warm gold (Architect) → deep red-gold (Commander)
- Single base model with equipment layers rendered on top — cosmetic unlocks attach to the base

**Level system:**

| Level range | Title | Visual unlocks |
|---|---|---|
| 1–5 | Grid Cadet | Base uniform |
| 6–10 | Grid Technician | Safety vest overlay |
| 11–20 | Grid Engineer | Tablet in hand, status light on helmet |
| 21–30 | Senior Engineer | Different jacket, shoulder patch |
| 31–40 | Grid Architect | Command-level gear, different lighting |
| 41–49 | Principal Engineer | Rare outfit tier, gold accents |
| 50 | Grid Commander | Unique model variant, special platform |

Levels are earned from XP — the same XP system that feeds kWh. Learning = levels = visual character progression. The loop is unified.

**Equipment cosmetics (unlocked through missions and milestones):**

| Unlock condition | Equipment item |
|---|---|
| Complete first Dispatch Call | Dispatcher's comms earpiece |
| Stabilise Iberia to 75% | Iberia region patch on sleeve |
| Resolve 10 incidents | Incident Response badge |
| Stabilise a region without any blackouts | "Clean Record" emblem |
| Reach Level 20 | Senior Engineer jacket |
| Complete Nordic scenario | Nordic grid patch |
| Experience (and recover from) a blackout | Weathered gear texture |
| Complete all 5 regions | Commander insignia |

Cosmetics are purely visual — no gameplay advantage. But they tell your story. A player with the weathered gear texture and the blackout recovery patch has a history. That's visible identity.

**Profile screen layout:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   [Name]                             [Level 14]         │
│   Grid Engineer                      ████████░░ 72% XP  │
│                                                          │
│            ┌──────────────────┐                         │
│            │                  │   STATS                 │
│            │   [3D rotating   │   Regions stabilised: 1 │
│            │    character]    │   Incidents resolved: 23 │
│            │                  │   Best stability: 108%  │
│            │   ── Lv.14 ──   │   Blackouts: 0          │
│            └──────────────────┘   Grid Score: 4,820     │
│                                                          │
│   EQUIPMENT                                             │
│   [Comms earpiece] [Iberia patch] [Incident badge]      │
│   [Locked] [Locked] [Locked]                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### The Dispatcher's 3D Figure

The Dispatcher is not just a text panel. He has a presence.

**Where he appears as a 3D figure:**
- **Dispatch Call modals** — his figure is visible in the corner of the modal, animated and gesturing as he speaks
- **Scenario briefing screens** — full presence, standing next to the regional map
- **Blackout screen** — specific "disappointed" pose
- **Milestone moments** — brief acknowledgment animation (a nod)
- **First-visit page greetings** — small floating figure in the bottom-right panel, not just text

**Dispatcher model:**
- Older than the player character. Senior. Authoritative posture.
- Same low-poly engineer aesthetic but visually distinct — commander-level gear from the start
- Idle animation: arms crossed, slight weight shift (he's watching, evaluating)

**Dispatcher animation states:**

| Moment | Animation |
|---|---|
| Default / idle | Arms crossed, slow weight shift |
| Speaking (normal) | Gesturing with one hand, direct eye line |
| Incident alert | Pointing urgently, leaning forward |
| Milestone | Single nod, arms uncross briefly |
| Blackout | Arms drop, head shake, direct stare |
| Quest complete | Brief approving nod, returns to idle |
| First meeting (new user) | Turns toward camera, sizes you up |

**The Dispatcher never smiles in the first region.** By the second region, he might. By the third, there's occasionally a dry comment that borders on warmth. This progression is invisible unless you're paying attention — but players who are will notice.

---

### Character as Social Signal

Eventually (not Phase 1): when a user's profile is shared or visible on a leaderboard, the character is what others see. Level 14 with a clean record and the Iberia patch tells a story immediately. No stats required.

This is the long-term value of the character system: it turns individual progress into a visible identity.

---

## Pillar 1: Build (Refined from existing)

The core deployment mechanic stays. Earn kWh through learning, spend to deploy assets, stability rises.

**Changes:**
- Deployment is still permanent — assets don't disappear
- Assets now have a **health/capacity %** (starts at 100%)
- Visual degradation: healthy nodes glow clean, degraded nodes flicker amber, offline nodes pulse red
- Asset effectiveness scales with health: `effectiveStability = stability * (health / 100)`

---

## Pillar 2: Defend — The Incident System

### What is an incident?
An **incident** is a real-time event that degrades one or more deployed assets. It triggers from **three sources**, keeping behavior unpredictable and the connection between learning and the grid alive:

**Source 1 — Passive time (clock-based)**
- Base rate: 1 incident per 18–36 hours per deployed asset (randomised within range)
- The more assets deployed, the more potential incident targets
- Active grid events accelerate degradation for relevant asset categories
- Regional stress (high blackout risk) increases incident frequency

**Source 2 — Activity-triggered (learning-linked)**
Learning activities can trigger thematically linked incidents. The logic: you're learning about these systems *because something is happening to them*.

| Learning activity | Possible triggered incident | Narrative logic |
|---|---|---|
| Complete a Transformer module | Transformer Trip | "You just learned why protection relays trip. Here's a live one." |
| Complete a Battery/Storage module | Battery Cell Failure | "Theory and practice arriving at the same time." |
| Complete a Frequency Response mission | Frequency Instability | "The mission was a simulation. This one isn't." |
| Complete 3 consecutive flashcard sessions | Solar Panel Degradation | "You've been focused on the books. The panels noticed." |
| Reach a new XP streak milestone | Random minor incident (Warning tier only) | Small cost for the distraction of learning |
| Complete a Dispatch Call quest | Related incident resolved — but a new one emerges elsewhere | One problem solved, another surfaces |

**Source 3 — Event-linked**
Active grid events (Cloud Cover, Evening Peak, Wind Ramp) increase incident probability for affected asset categories during their duration. Cloud Cover doesn't just penalise stability — it can actually degrade the Solar Array while it runs.

**Why this works:** The unpredictability is the point. Players can't schedule their repairs. They can't ignore the grid for two days and come back to a clean slate. And finishing a learning session might mean immediately needing to apply that knowledge to a real incident.

### Incident types

| Incident | Affects | Narrative hook | Stability impact |
|---|---|---|---|
| Solar Panel Degradation | Solar Forecasting Array | "Dust accumulation on the panels. Output's dropping." | -15% to -40% capacity |
| Transformer Trip | Smart Transformer | "Bus fault on the 220kV side. Tripped the protection relay." | Offline (0%) |
| Battery Cell Failure | Battery Storage | "Thermal runaway starting in cell block C. Isolate it now." | -20% to -50% capacity |
| Frequency Instability | Frequency Controller | "We're seeing 0.4Hz deviation. The inertia response isn't holding." | -10% to -30% capacity |
| Demand Spike Overload | Demand Response System | "Load curve spiked 18% above forecast. The DRS is overwhelmed." | -25% capacity |
| HVDC Fault | HVDC Interconnector | "Converter station fault on the DC link. Cross-region transfer at zero." | Offline (0%) |
| Algorithm Drift | AI Grid Optimizer | "Model's overfitting last week's data. Forecasts are diverging." | -15% to -25% capacity |

### Responding to incidents
- Each incident has a **repair cost** in kWh (proportional to severity)
- Incidents have a **response window** — if ignored, degradation worsens passively
- Repair is instant when you spend the kWh
- Unrepaired offline assets count as undeployed in stability calculations

### Incident severity tiers

| Tier | Capacity remaining | Response window | Repair cost |
|---|---|---|---|
| Warning | 60–80% | 48 hours | 0.5–1 kWh |
| Critical | 30–60% | 24 hours | 1–3 kWh |
| Offline | 0% | 12 hours | 3–6 kWh |

If a Warning is ignored past its window, it escalates to Critical. Critical ignored → Offline. Offline ignored → Blackout.

---

## Blackout Events — The Failure State

A **Blackout Event** is serious, always recoverable, never permanent — but painful enough to matter.

### What triggers a blackout?
- Blackout risk reaches 100% (incidents + events + no mitigation)
- An offline anchor asset (Control Center) unresolved past its window

### Blackout consequences (serious but recoverable)
1. **Region goes dark** — affected region loses its activation milestone (must re-stabilize from scratch)
2. **Stability crater** — one-time -25% stability penalty that persists until the region is restored
3. **Emergency repair costs** — all repairs in a blackout state cost **3× normal**
4. **Grid Score penalty** — visible on profile, affects mission unlock eligibility
5. **Dispatcher consequences** — the narrative reflects it. The Dispatcher is not happy.

### What blackout does NOT do
- Does not remove deployed assets
- Does not reset kWh earned
- Does not lock you out

### Recovering from a blackout
1. Pay the emergency repair cost on the failed asset
2. Re-stabilize the affected region to its previous milestone
3. Stability and score recover partially (not fully — the incident is on your record)
4. A "Recovery Mode" UI state guides the path back clearly

---

## The Grid Infrastructure Model — Universal Voltage Hierarchy

Every region in the game is built on the same real-world power system architecture. This isn't abstracted away — it *is* the game. Players learn the hierarchy by building it.

### The voltage stack (bottom → top = consumer → generation)

```
  [Generation / Interconnects]
          ↕
    330kV / 400kV         — Transmission backbone. Long-distance bulk transfer.
          ↕
       110kV              — Sub-transmission. Connects transmission to regional centres.
          ↕
        35kV              — Regional distribution. Industrial customers, large towns.
          ↕
        10kV              — Urban / suburban distribution. Dense networks, switching rings.
          ↕
        0.4kV             — Low voltage. Service points. Homes, small businesses.
```

Each voltage level is a **tier of infrastructure** the player must build, in order. You cannot energise 10kV lines without a 35/10kV transformer. You cannot build that transformer without a 110/35kV substation behind it. The dependency chain is the educational scaffolding.

### Universal asset set (all regions, adapted locally)

**Tier 0 — Control & Monitoring (prerequisite for everything)**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| Grid Control Centre (SCADA/EMS) | Energy management system, real-time monitoring | 0 kWh (free) | +5% — enables telemetry across all tiers |
| Protection & Relay System | Fault detection, automatic isolation | 1 kWh | +4% — prevents cascades, reduces blackout risk |

**Tier 1 — 330kV Transmission**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| 330kV Overhead Transmission Line | Bulk power transfer across the region | 3 kWh | +10% — backbone of the grid |
| 330/110kV Autotransformer Substation | Steps down from transmission to sub-transmission | 4 kWh | +8% — gateway to distribution |
| HVDC Interconnector | Cross-border DC link (import/export balance) | 15 kWh | +20% — geopolitical and physical lifeline |

**Tier 2 — 110kV Sub-transmission**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| 110kV Switching Substation | Distributes power across regional network | 3 kWh | +8% — enables regional load balancing |
| 110/35kV Power Transformer | Steps down to regional distribution voltage | 4 kWh | +6% — feeds towns and industrial zones |
| 110kV Cable Segment (underground) | Urban sub-transmission, lower fault exposure | 5 kWh | +4% + reduced incident rate in urban zone |

**Tier 3 — 35kV Regional Distribution**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| 35kV Distribution Substation | Regional power centre, feeds 10kV feeders | 3 kWh | +6% |
| 35/10kV Transformer | Steps down to urban distribution | 3 kWh | +5% |
| Reactive Power Compensation (Capacitor Bank) | Voltage support, power factor correction | 4 kWh | +6% stability, -8% blackout risk |

**Tier 4 — 10kV Urban Distribution**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| 10kV Ring Main Network | Closed-ring distribution for redundancy | 4 kWh | +7% — enables fault isolation without outage |
| 10kV Feeder Automation (Remote Switching) | Automatic fault isolation, self-healing grid | 5 kWh | +5%, incident response window +6h |
| 10/0.4kV Distribution Transformer | Final voltage step-down to consumer level | 2 kWh | +4% per zone |

**Tier 5 — 0.4kV Low Voltage / Service Points**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| LV Distribution Network (0.4kV) | Consumer connections, street-level cables | 2 kWh | +3% — final mile |
| Smart Metering Infrastructure (AMI) | Real-time demand visibility, remote disconnect | 4 kWh | +5% forecast confidence, demand response enabled |
| Battery Energy Storage System (BESS) | Distributed storage, frequency response | 8 kWh | +12% stability, +15% risk mitigation |

**Cross-tier — Flexibility & Optimisation**

| Asset | Function | Cost | Stability effect |
|---|---|---|---|
| Demand Response Aggregator | Coordinates flexible loads across the grid | 8 kWh | +10% stability during peak events |
| Grid-Scale Frequency Regulator | Primary + secondary frequency response | 6 kWh | +10% stability, eliminates frequency deviation incidents |
| AI Forecasting & Optimisation Platform | Load forecasting, generation scheduling | 15 kWh | +18% stability, +25% forecast confidence |

**Total to fully build a region: ~120 kWh** — a campaign arc of weeks of learning.

---

## Pillar 3: Expand — Regional Campaigns

### Campaign structure

Each region is a self-contained grid scenario built on the universal voltage hierarchy above. Same tiers, different geography, different generation mix, different historical narrative, different events and challenges.

### Planned regions

| # | Region | Grid character | Unique challenge | Unlock |
|---|---|---|---|---|
| 1 | **Lithuania** | Post-Soviet grid desynchronising from BRELL | BRELL exit instability, frequency isolation risk, limited reserve margin | Starting grid |
| 2 | **Nordic (Sweden/Finland border)** | Hydro-dominant, wind-heavy | Wind drought, hydro reservoir depletion, cold snap | Lithuania 100% |
| 3 | **UK (East Anglia offshore zone)** | Offshore wind + aging onshore grid | Sea storms, cable faults, tidal variation, low inertia | Nordic 75% |
| 4 | **California (CAISO)** | Solar-dominant, duck curve | Midday overgeneration, evening ramp, wildfire risk, grid fires | UK 75% |
| 5 | **Texas (ERCOT)** | Islanded grid, extreme weather | Winter freeze killing baseload, no external interconnect | California 100% |

### Region 1 — Lithuania: The BRELL Exit

**Why Lithuania is the perfect opening scenario:**
Lithuania (along with Latvia and Estonia) has operated on the BRELL synchronous ring since the Soviet era — a grid physically and politically connected to Russia and Belarus. The Baltic states are currently in the process of desynchronizing from BRELL and synchronizing with the Continental European grid (ENTSO-E). This is one of the most significant grid engineering projects in European history, driven by both technical necessity and geopolitical urgency.

**The narrative:**
*March 2025. The desynchronization date is set. Lithuania's 330kV grid will island from BRELL at 06:00 on a chosen day and reconnect via the LitPol Link and NordBalt cables to Continental Europe. You are the grid engineer on duty. LITGRID's control room. The Dispatcher is your supervisor.*

**Lithuania-specific assets (on top of universal set):**

| Asset | Lithuania context |
|---|---|
| LitPol Link (HVDC) | 500MW DC interconnector to Poland — the lifeline to Continental Europe |
| NordBalt Cable | 700MW HVDC submarine cable to Sweden — northern backup |
| Elektrėnai Power Plant | Gas-fired thermal backup for reserve margin |
| Kruonis Pumped-Storage | 900MW pumped hydro — Lithuania's largest flexibility resource |
| Synchronous Condenser (Daugava) | Rotating machine providing synthetic inertia post-BRELL |

**Lithuania-specific events:**

| Event | Description | Effect |
|---|---|---|
| BRELL Frequency Deviation | Russian/Belarusian side destabilizes frequency before cut-off | -15% stability, frequency instability risk |
| Island Mode Test | Planned 24h islanding drill — grid must survive on its own | No imports/exports, reserve margin critical |
| Winter Demand Peak | Lithuanian winter heating load, -20°C nights | +25% demand, flexibility assets under pressure |
| LitPol Link Congestion | Cross-border capacity fully utilised | No additional import capacity, must balance domestically |
| Baltic Wind Lull | Low wind across all Baltic states simultaneously | Renewables near zero, thermal backup must cover |

**Lithuania Dispatch Calls (5 quests):**

1. *"First Contact"* — intro, deploy SCADA/EMS, understand the 330kV backbone
2. *"Building the Backbone"* — 330kV line + 330/110kV transformer, first sub-transmission zone online
3. *"The Last Winter on BRELL"* — survive an Island Mode test at 50% build completion
4. *"Distribution or Darkness"* — race to get 10kV ring networks live before evening peak
5. *"Independence Day"* — desynchronization event. Final boss. Full grid must hold at 50Hz ±0.2Hz for 60 minutes post-BRELL exit.

**Regional Contact: Tomas Žukauskas**
Senior control room engineer, LITGRID. 22 years on the Lithuanian grid. Was on shift during the 2006 European blackout. Quietly nervous about the desync. Trusts process over politics.

*"I've run the simulations 200 times. Technically it should work. But simulations don't have Russian operators on the other end of the line."*

### Region-specific infrastructure variations

**Nordic region (Sweden/Finland):**
- 400kV transmission (Nordic standard, not 330kV)
- Hydro reservoir as primary storage (replaces BESS in flexibility role)
- District heating network as demand-side flexibility
- 132kV sub-transmission (different from Lithuanian 110kV standard)

**UK (offshore zone):**
- 33kV offshore collector arrays feeding 132kV onshore
- 275kV / 400kV transmission (UK National Grid standard)
- Subsea cable assets with higher incident rates (sea damage)
- Synchronous condensers at scale (low inertia challenge)

**California (CAISO):**
- 500kV / 230kV transmission (Western Interconnection standards)
- Utility-scale solar replacing thermal in generation mix
- Pumped hydro + long-duration battery
- Fire hardening assets (undergrounding in wildfire zones)

**Texas (ERCOT):**
- 345kV / 138kV ERCOT standard
- No HVDC interconnector available (islanded by design)
- Weatherisation assets (critical after 2021 freeze)
- Demand response at extraordinary scale (only tool available during extremes)

### Persistent cross-region bonuses

| Region completed | Bonus |
|---|---|
| Lithuania 100% | +5% base stability on all future regions. *"You built it from scratch once. You know the fundamentals."* |
| Nordic 100% | Incident response windows +12h everywhere. *"Nordic grid taught you patience."* |
| UK 100% | Emergency blackout repair cost capped at 1.5× (not 3×). *"Offshore taught you to work fast under pressure."* |
| California 100% | All forecasting assets cost 15% less globally. *"Duck curve taught you to predict, not react."* |
| Texas 100% | ??? — earned by those who make it |

---

## Pillar 4: The Narrative Layer

### The concept
Every mechanic is wrapped in story. A transformer trip isn't just "-8% stability" — it's a moment. The Dispatcher radios in. You learn what a transformer trip actually is, why it matters, what happens if you don't fix it. Then you fix it.

Inspired by RuneScape's quest system — clear objectives, character voices, world-building rewards — but modern, minimal, and non-cluttering. The story is always optional to read. The game works without it. But players who engage are rewarded with context, immersion, and a reason to care.

---

### The Dispatcher — Everywhere, Not Just the Grid

The Dispatcher is not a grid-only character. He is the voice of the entire platform. Every page a new user visits for the first time gets a brief, non-blocking Dispatcher greeting that explains what they're looking at and why it matters — in his voice, not in UI copy.

This is not a tutorial. Tutorials are skipped. This is a character speaking to you contextually, once, and then stepping back.

**Dispatcher presence across the app:**

| Page | First-visit Dispatcher moment | What it does |
|---|---|---|
| **Home** | *"You're in. This is your operations hub. Your learning progress, your grid status, your missions — all from here. Where you focus first is up to you."* | Frames the platform as a mission, not a course |
| **Theory / Learn** | *"This is the reading section. Every concept you learn here translates to kWh you can deploy on the grid. Don't rush it — the grid rewards depth."* | Makes learning feel purposeful, not academic |
| **Practice / Flashcards** | *"Flashcards. Fast reps. Every correct answer charges the grid. Your streak multiplies the reward. Don't break it."* | Reframes flashcards as fuel, not testing |
| **Missions** | *"These are live incident simulations. Based on real grid failures. Complete them and you'll unlock assets — and understand exactly why they matter."* | Gives missions stakes before the user even starts one |
| **Grid / Energy** | *"This is your grid. Lithuania. BRELL exit is in 90 days. Stability is at 38% — nowhere near ready. You have some kWh to work with. Start with the Control Centre."* | Turns the first grid view into a briefing, not a UI explanation |
| **HRB / Notebook Analysis** | *"This is the notebook audit module. Real pipeline logs, real anomalies. Your job is to find what's wrong before it becomes a production incident."* | Frames the HRB task as a live diagnostic, not an exercise |
| **Progress** | *"Your record. Stability scores, learning streaks, missions completed. This is how you'll know if you're actually ready."* | Turns the progress page into a performance review |
| **Settings** | *(no Dispatcher — this is admin territory)* | — |

**Design rules for Dispatcher page appearances:**
- One appearance per page, ever. No repeats unless user resets onboarding.
- Always a small, unobtrusive panel — bottom-left or bottom-right, never center modal
- Max 2 sentences. Never a lecture.
- Dismissible immediately — one tap, gone forever for that page
- Never blocks interaction. The user can use the page while the Dispatcher is speaking.
- Appears with a brief animation: panel slides in from the edge (0.3s), Dispatcher avatar fades in, text types in (fast — not slow cinematic typing)
- After 8 seconds of no dismissal, it fades out automatically

**Dispatcher panel component design:**
```
┌──────────────────────────────────────────┐
│  [D]  The Dispatcher                     │
│  ──────────────────────────────────      │
│  "This is your grid. Iberia. 38%         │
│  stability. I'd start with the           │
│  Control Center."                        │
│                              [Got it]    │
└──────────────────────────────────────────┘
```
- `[D]` is a small avatar/icon — consistent across the app
- Small, docked to bottom-right
- `[Got it]` dismisses permanently for that page
- No X button — the CTA IS the dismiss

**Progression in tone:**
The Dispatcher's first-visit messages are neutral/professional. After the user has visited all pages once, subsequent Dispatcher moments (incidents, milestones) shift to slightly warmer. He's assessed you. You're not a stranger anymore.

---

### The Dispatcher A veteran. Been managing grids since before the 2028 transition. Terse, professional, occasionally dry. Trusts you more as you prove yourself. Doesn't sugarcoat failures.

**Voice:** Direct. Technical but accessible. Like mission control — every word is information.

> *"You've got a transformer fault on the 220kV bus. Protection relay tripped it offline. That means we're running the western corridor on one leg right now. Fix it before peak demand hits tonight or we're looking at cascades."*

**Presence:** The Dispatcher appears in:
- Every Dispatch Call (quest)
- Incident notifications
- Milestone moments
- Blackout events
- Scenario briefings

As you progress through regions, The Dispatcher's tone shifts — from guarded professional to something closer to a mentor. Small dialogue changes mark this.

---

### Regional Contacts

Each region introduces a local expert character who adds colour and region-specific knowledge:

| Region | Character | Role |
|---|---|---|
| Iberia | **Elena Voss** | Renewable integration engineer, ENTSO-E secondment |
| Nordic | **Mikael Strand** | Hydro operations veteran, 30 years on the dam controls |
| UK Offshore | **Priya Nair** | Offshore transmission specialist, survived the 2031 North Sea storm |
| California | **Jordan Reyes** | Solar forecasting lead, built the original duck curve models |
| Texas | **Ray Kowalski** | ERCOT operator, was on shift during the 2021 and 2034 freezes |

Regional contacts appear in Dispatch Calls within their region and occasionally radio in during severe incidents.

---

### Dispatch Calls (Quests)

A **Dispatch Call** is a narrative quest. Each region has 3–5 of them, building a story arc across the campaign.

**Structure of a single Dispatch Call:**

```
┌─────────────────────────────────────────────────────┐
│  📻  DISPATCH CALL #2 — "The Evening Problem"       │
│  ─────────────────────────────────────────          │
│  [Dispatcher portrait]                              │
│                                                     │
│  "Every evening at 20:00, demand spikes 22%         │
│  while solar output hits zero. We call it the       │
│  duck curve. Right now, we have nothing to          │
│  absorb it."                                        │
│                                                     │
│  ──── What's happening ────                         │
│  When solar generation drops at sunset, grid        │
│  operators must ramp up flexible reserves within    │
│  minutes. Without storage or fast-response          │
│  assets, frequency drops and relays trip.           │
│                      [Learn more →]                 │
│                                                     │
│  ──── Your objective ────                           │
│  → Deploy Battery Storage                          │
│  → Maintain stability > 60% through tonight's      │
│    Evening Peak event                               │
│                                                     │
│  ──── Reward ────                                   │
│  1.2 kWh  |  +150 Grid Score                       │
│                                                     │
│  [Start]                [Later]                     │
└─────────────────────────────────────────────────────┘
```

**Design rules:**
- Maximum 4 lines of Dispatcher dialogue
- Concept explanation is always 2–3 sentences, never a lecture
- "Learn more" always links to the relevant theory module
- Objectives are always concrete and tied to real game mechanics
- Player can always dismiss and return later — no blocking

---

### Incident pop-ups (narrative)

When a passive incident triggers, a notification arrives. Tapping it opens the incident pop-up:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  INCIDENT — Battery Storage                     │
│  ─────────────────────────────────────────          │
│  "Thermal sensors flagging cell block C.            │
│  Early-stage runaway. You've got 24 hours           │
│  before this cascades."                             │
│                                                     │
│  What's happening: Lithium cell thermal runaway     │
│  occurs when heat generation exceeds dissipation.  │
│  Left unchecked, it propagates through the pack.   │
│                                                     │
│  Asset health: 45%  →  dropping                    │
│  Repair cost: 1.8 kWh                              │
│  Response window: 23h 41m                          │
│                                                     │
│  [Repair — 1.8 kWh]          [View grid]           │
└─────────────────────────────────────────────────────┘
```

---

### Milestone moments (narrative)

When a stability milestone is crossed, The Dispatcher acknowledges it — briefly:

> *"Western Corridor is back online. Monitoring restored across the sector. Four regions to go."*

These are 2-second toast notifications, not blocking modals. Keep the rhythm.

---

### Blackout moment (narrative — dramatic)

A blackout earns the only full-screen narrative moment in the game:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           ⚡  BLACKOUT                              │
│        Eastern Region — offline                     │
│                                                     │
│  "The Eastern sector just went dark. Cascading      │
│  fault from the battery failure we discussed.       │
│  300,000 homes. I'm not going to sugarcoat it."    │
│                                                     │
│  ── What happened ──                               │
│  Battery cell failure → capacity at 0% →           │
│  flexibility reserve exhausted → frequency fell    │
│  below 49.5Hz → under-frequency relays tripped     │
│  → cascade.                                        │
│                                                     │
│  Emergency repair: 5.4 kWh (3× normal)             │
│  Region stability: reset to 0%                      │
│  Grid Score: -200                                   │
│                                                     │
│  [Start recovery]                                   │
└─────────────────────────────────────────────────────┘
```

---

### Scenario briefing (cinematic intro)

Each new region opens with a full briefing — the only place in the game where you sit back and read before acting:

```
┌─────────────────────────────────────────────────────┐
│  📍  NORDIC GRID — Scenario Briefing               │
│  ─────────────────────────────────────────          │
│  [Region map visual]                                │
│                                                     │
│  March 2035. The Nordic grid is 87% wind.           │
│  That was a triumph until this winter, when         │
│  a 72-hour wind drought dropped output to 4%.       │
│  The hydro reserves held, but barely.               │
│                                                     │
│  Mikael Strand, Nordic Operations:                  │
│  "You stabilised Iberia. Good. But this is          │
│  different. Wind is either everywhere or nowhere.   │
│  You'll need to think in terms of days, not hours." │
│                                                     │
│  The Dispatcher:                                    │
│  "New grid. New rules. Same stakes."                │
│                                                     │
│  Starting stability: 38%                            │
│  Available kWh: carried from Iberia + 2.0 bonus    │
│                                                     │
│  [Begin]                                            │
└─────────────────────────────────────────────────────┘
```

---

## Progression & Rewards

### kWh economy (updated)

| Activity | Earns |
|---|---|
| Correct flashcard | 0.02 kWh |
| Streak milestones | 0.30 kWh |
| Mission completion | 0.4–2.4 kWh |
| Chapter completion | 0.15 kWh |
| **Incident repaired (fast — within 25% of window)** | **+0.1 kWh bonus** |
| **Region stabilised to 100%** | **+2.0 kWh one-time** |
| **Blackout narrowly avoided (risk hit 90%+)** | **+0.5 kWh bonus** |
| **Dispatch Call completed** | **0.5–1.5 kWh** |

### Grid Score

Each region has a **Grid Score** tracked separately:

| Factor | Effect |
|---|---|
| Peak stability achieved | +points |
| Incidents resolved before Critical | +points |
| Incidents that reached Offline | -points |
| Blackouts experienced | -200 points each |
| Speed of stabilisation | efficiency bonus |
| kWh efficiency (stability / kWh spent) | bonus multiplier |

Grid Score is visible on profile, used for mission unlocks, and shown on the region selector.

---

## UI/UX — What Changes

### New components needed

| Component | Description |
|---|---|
| `DispatchCallModal` | Full quest pop-up with narrator portrait, narrative text, concept explainer, objectives, reward |
| `IncidentAlertModal` | Incident notification pop-up with narrative framing, health status, repair CTA |
| `BlackoutScreen` | Full-screen blackout moment with narrative, cascade explanation, recovery CTA |
| `ScenarioBriefingModal` | Region intro screen with map visual, narrator dialogue, starting conditions |
| `MilestoneToast` (update) | Append Dispatcher dialogue line to existing toast |
| `RegionSelector` | World map / card picker showing all regions, status, lock state |
| `AssetHealthBar` | Small health indicator beneath each deployed node on the grid map |
| `IncidentBadge` | Nav badge on energy icon when active incidents exist |

### Node visual states (updated)

| State | Visual |
|---|---|
| Undeployed | Grey, dotted border |
| Deployed — Healthy (80–100%) | Clean glow, solid border |
| Deployed — Warning (60–79%) | Amber flicker, warning pulse |
| Deployed — Critical (30–59%) | Orange pulse, health bar prominent |
| Deployed — Offline (0%) | Red pulse, dead animation, node label shows "OFFLINE" |
| Post-blackout region | Dark wash over entire region's nodes |

---

## Technical Implementation Plan

### Phase 0 — Character System + 2D Grid Redesign (visual foundation)
1. Build `CharacterViewer` component — Three.js scene embedded in profile page, rotating low-poly figure on platform
2. Define base character model (single Blender file, low-poly engineer)
3. Build level system — XP → level calculation, title mapping, level display on profile
4. Build `DispatcherFigure` component — Dispatcher 3D model with animation states (idle, talking, urgent, disappointed)
5. Redesign `GridMapCanvas` — dark terrain background, SVG edge particle animation, CSS node bloom, deploy ripple effect
6. Build stability atmosphere layer — CSS gradient/filter system mapped to stability tier

### Phase 1 — Incident System + Narrative Layer
1. Add `asset_health` JSONB field to `grid_ops_state` (per-asset %)
2. Add `incidents` table: `(id, user_id, scenario_id, asset_id, severity, triggered_at, expires_at, resolved_at, repair_cost_units)`
3. Add incident generation logic — runs on grid state fetch, checks elapsed time + conditions
4. Add `POST /api/grid-ops/incident/repair` endpoint
5. Update engine to compute effective stability using `health %`
6. Build `IncidentAlertModal` component with narrative framing
7. Build `AssetHealthBar` component and wire to node visuals
8. Add `IncidentBadge` to nav
9. Add `dispatch_calls` table and `DispatchCallModal` component
10. Author Dispatch Calls 1–5 for Iberia

### Phase 2 — Blackout Events
1. Add blackout detection to engine (risk >= 100)
2. Add `blackouts` table
3. Build `BlackoutScreen` component
4. Implement region deactivation + re-stabilisation flow
5. Add Grid Score system and penalty tracking

### Phase 3 — Regional Expansion
1. Define Nordic scenario config (assets, events, layout, Dispatch Calls)
2. Build `RegionSelector` UI
3. Add multi-scenario support to `grid_ops_state`
4. Build `ScenarioBriefingModal`
5. Wire unlock requirements to region access
6. Author Mikael Strand character dialogue

---

## Open Questions (remaining)

- **Notification delivery?** Push notifications via service worker, email, or in-app only? Recommendation: start with in-app badges + email digests ("Your grid has 2 active incidents"), build to push notifications later.
- **Activity-triggered incident rate?** Not every module completion should trigger an incident — that would feel punishing. Suggested: ~30% chance on module completion, 100% on specific thematically matched completions. Tune after playtesting.
- **Multiplayer/competitive later?** Weekly grid challenges with a leaderboard — keep data model flexible. One row per user per scenario already supports this.
- **Mobile incident view?** A simplified "incident dashboard" for mobile: just the list of active incidents, health bars, and repair CTAs — no need to render the full grid map.
- **Onboarding to the narrative?** First-time users need to understand the Dispatcher concept before the first Dispatch Call lands. A brief "comms incoming" animation on first grid entry could set this up without a tutorial screen.
