import type { GridOpsDispatchCallView } from './types';

// ─── Internal definition (includes trigger thresholds) ───────────────────────

interface DispatchCallDefinition {
  id: string;
  title: string;
  summary: string;
  dialogue: string[];
  reward_units: number;
  trigger_stability_min: number;
  trigger_turn_min: number;
}

const DISPATCH_CALLS: DispatchCallDefinition[] = [
  {
    id: 'iberia_v1_call_01',
    title: 'First Contact',
    summary: 'The Dispatcher makes first contact as you power up the grid.',
    dialogue: [
      "This is Control. You're now connected to the Iberian Grid Management Network.",
      "Your mission: restore stability to a stressed transmission system. The region's been through a rough summer.",
      "Deploy infrastructure, manage incidents, and keep the lights on. I'll guide you.",
      "First step — get your Smart Transformer online. It's your primary voltage backbone."
    ],
    reward_units: 200,
    trigger_stability_min: 0,
    trigger_turn_min: 0
  },
  {
    id: 'iberia_v1_call_02',
    title: 'Stability Report',
    summary: "You've pushed stability past 60%. The Dispatcher wants a debrief.",
    dialogue: [
      "Grid is holding above 60%. Not bad — most new engineers lose it to the morning demand spike.",
      "Keep an eye on your reserve margins. The Iberian grid has a long tail of legacy substations.",
      "If you see incident alerts, don't ignore them. Small faults compound fast."
    ],
    reward_units: 400,
    trigger_stability_min: 60,
    trigger_turn_min: 3
  },
  {
    id: 'iberia_v1_call_03',
    title: 'Cascade Warning',
    summary: 'High-risk conditions detected. Dispatcher issues an urgent briefing.',
    dialogue: [
      "I'm seeing cascade risk flags across the eastern corridor. This is how the 2006 blackout started.",
      "You need more redundancy. If one backbone link goes down without fallback, it all goes.",
      "Deploy your HVDC link and Flywheel Reserve before the next storm event."
    ],
    reward_units: 600,
    trigger_stability_min: 55,
    trigger_turn_min: 6
  },
  {
    id: 'iberia_v1_call_04',
    title: 'Renewable Integration',
    summary: 'The Dispatcher briefs you on the solar variability challenge.',
    dialogue: [
      "Solar capacity factor just spiked 40% in 90 minutes. Classic Iberian spring.",
      "Renewables are cheap but they punish grids without smart forecasting and storage.",
      "Your AI Grid Brain is the answer here — it reads the variability patterns faster than any human."
    ],
    reward_units: 800,
    trigger_stability_min: 72,
    trigger_turn_min: 9
  },
  {
    id: 'iberia_v1_call_05',
    title: 'Optimal State',
    summary: "You've reached optimal stability. The Dispatcher gives final commendation.",
    dialogue: [
      "90% stability. I've seen engineers with 10 years of experience not hit that.",
      "The Iberian Grid is now one of the most stable in the interconnect. You've earned this.",
      "Keep the infrastructure maintained. Incidents are inevitable — what matters is how fast you respond.",
      "This is Control, signing off. The grid is in good hands."
    ],
    reward_units: 1500,
    trigger_stability_min: 90,
    trigger_turn_min: 12
  },
  // ─── Region activation calls ───────────────────────────────────────────────
  {
    id: 'iberia_v1_region_call_01',
    title: 'Western Corridor Online',
    summary: 'The western monitoring corridor is live. Dispatcher confirms telemetry.',
    dialogue: [
      "Western monitoring corridor is up. Telemetry is live across the first transmission segment.",
      "Control center and transformer are reading clean voltage profiles.",
      "The central mesh is next. Get frequency control and the AI optimizer deployed."
    ],
    reward_units: 300,
    trigger_stability_min: 26,
    trigger_turn_min: 1
  },
  {
    id: 'iberia_v1_region_call_02',
    title: 'Central Mesh Online',
    summary: 'Mid-grid coordination is active. Dispatcher confirms dispatch routing.',
    dialogue: [
      "Central coordination mesh is online. Dispatch commands are routing across mid-grid.",
      "Frequency and forecasting coverage is holding. The stack is starting to talk to itself.",
      "Eastern demand zone is the next threshold. High load, high stakes."
    ],
    reward_units: 500,
    trigger_stability_min: 51,
    trigger_turn_min: 4
  },
  {
    id: 'iberia_v1_region_call_03',
    title: 'Eastern Demand Zone',
    summary: 'The eastern demand corridor is stabilized. Full grid coverage achieved.',
    dialogue: [
      "Eastern demand stabilization is active. Load flow is nominal across the full corridor.",
      "Flexibility and reinforcement assets are carrying the eastern grid.",
      "You're approaching interconnect threshold. One more push and the full ring is live."
    ],
    reward_units: 700,
    trigger_stability_min: 76,
    trigger_turn_min: 8
  },

  // ─── Lithuania ─────────────────────────────────────────────────────────────
  {
    id: 'lithuania_v1_call_01',
    title: 'Baltic Grid Boot',
    summary: 'Baltic Grid Control makes first contact as Lithuania enters island mode.',
    dialogue: [
      "This is Baltic Grid Control. Lithuania just desynchronized from the BRELL ring. We are in island mode.",
      "Your mission: stabilize the grid before it reconnects to the Continental European Network.",
      "Without the Soviet ring balancing us, every asset you deploy is the only line of defence.",
      "Start with the Control Center. Nothing works without telemetry in island mode."
    ],
    reward_units: 200,
    trigger_stability_min: 0,
    trigger_turn_min: 0
  },
  {
    id: 'lithuania_v1_call_02',
    title: 'Frequency Watch',
    summary: "Stability above 60%. Dispatcher warns about island-mode frequency drift.",
    dialogue: [
      "Grid is holding above 60%. Creditable — Baltic grids rarely reach this in the first isolation phase.",
      "Watch the frequency drift. Without the BRELL ring averaging us out, reserves are fully on you.",
      "If you see incident alerts on the transformer or frequency controller, respond immediately."
    ],
    reward_units: 400,
    trigger_stability_min: 60,
    trigger_turn_min: 3
  },
  {
    id: 'lithuania_v1_call_03',
    title: 'Island Mode Risk',
    summary: 'Running isolated is exposing cascade vulnerability. Dispatcher issues warning.',
    dialogue: [
      "We have no neighboring system to bail us out. Lithuania is the only source of inertia on this grid.",
      "One backbone failure without redundancy and the whole island goes dark. No second chances here.",
      "Deploy your HVDC interconnect and flywheel reserve. Those are your emergency frequency anchors."
    ],
    reward_units: 600,
    trigger_stability_min: 55,
    trigger_turn_min: 6
  },
  {
    id: 'lithuania_v1_call_04',
    title: 'Baltic Wind Surge',
    summary: 'Offshore wind ramp running well above forecast. AI coordination needed.',
    dialogue: [
      "Offshore Baltic wind just ramped 38% above forecast. Classic autumn storm corridor.",
      "Unpredicted generation swings are how island grids lose frequency lock — fast.",
      "Your AI Grid Optimizer is the fix. It reads wind patterns across the Baltic basin faster than any human."
    ],
    reward_units: 800,
    trigger_stability_min: 72,
    trigger_turn_min: 9
  },
  {
    id: 'lithuania_v1_call_05',
    title: 'ENTSO-E Sync Approved',
    summary: "Grid has reached synchronization threshold. Continental European Network handshake initiated.",
    dialogue: [
      "90%+ stability. ENTSO-E synchronization ceremony is approved. Lithuania joins the Continental European Network.",
      "This is the first Baltic state to hit operational standards for full synchronization. You made that happen.",
      "Keep the infrastructure maintained. The BRELL era is over. Europe is watching.",
      "This is Baltic Grid Control, standing down. The grid is in good hands."
    ],
    reward_units: 1500,
    trigger_stability_min: 90,
    trigger_turn_min: 12
  },
  // Lithuania region calls
  {
    id: 'lithuania_v1_region_call_01',
    title: 'Western Corridor Online',
    summary: 'Vilnius corridor monitoring is live. Dispatcher confirms telemetry.',
    dialogue: [
      "Western monitoring segment is live. Telemetry is reading clean across the Vilnius corridor.",
      "Control center and transformer are nominal. Voltage profiles are stable.",
      "Central mesh is next — frequency management is critical in island mode."
    ],
    reward_units: 300,
    trigger_stability_min: 26,
    trigger_turn_min: 1
  },
  {
    id: 'lithuania_v1_region_call_02',
    title: 'Central Mesh Online',
    summary: 'Mid-grid coordination is active. Dispatch routing through Baltic backbone.',
    dialogue: [
      "Central coordination mesh is online. Dispatch commands routing through Baltic mid-grid.",
      "Frequency and forecasting are holding. The Baltic stack is starting to self-balance.",
      "Eastern demand zone next — the Kaunas–Klaipėda industrial corridor. High load in island mode."
    ],
    reward_units: 500,
    trigger_stability_min: 51,
    trigger_turn_min: 4
  },
  {
    id: 'lithuania_v1_region_call_03',
    title: 'Eastern Demand Zone',
    summary: 'Kaunas–Klaipėda corridor stabilized. Full Baltic grid coverage achieved.',
    dialogue: [
      "Eastern demand is stable. Load flow nominal across the Kaunas–Klaipėda port corridor.",
      "Flexibility and reinforcement assets are anchoring the eastern sector.",
      "You're approaching ENTSO-E synchronization threshold. One final push."
    ],
    reward_units: 700,
    trigger_stability_min: 76,
    trigger_turn_min: 8
  },

  // ─── Nordic ────────────────────────────────────────────────────────────────
  {
    id: 'nordic_v1_call_01',
    title: 'Hydro Reserves Online',
    summary: 'Nordic Grid Operations makes first contact. Hydropower dispatch begins.',
    dialogue: [
      "Nordic Grid Operations here. You're managing 60% hydro, 30% wind — the most renewable grid in the world.",
      "Your challenge isn't generation capacity. It's dispatch timing against reservoir levels and weather windows.",
      "Deploy your monitoring infrastructure first. Hydro dispatch without telemetry is reservoir roulette."
    ],
    reward_units: 200,
    trigger_stability_min: 0,
    trigger_turn_min: 0
  },
  {
    id: 'nordic_v1_call_02',
    title: 'Reservoir Intelligence',
    summary: "Hydro dispatch running at acceptable margins. Spring melt risk stabilizing.",
    dialogue: [
      "Hydro dispatch is holding. Spring melt risk is within bounds — that's the hardest part of Nordic operations.",
      "Wind is contributing 28% of real-time generation. Frequency is nominal.",
      "Watch the German interconnect. When their grid dips, they pull from Nordic reserves fast."
    ],
    reward_units: 400,
    trigger_stability_min: 60,
    trigger_turn_min: 3
  },
  {
    id: 'nordic_v1_call_03',
    title: 'Forced Export Risk',
    summary: 'Cross-border flow from Germany spiking. Nordic reserves under pressure.',
    dialogue: [
      "Cross-border draw from Germany just spiked. Nordic reserves are absorbing a European shortfall.",
      "This is how Nordic grids get destabilized — forced exports during Central European heat events.",
      "Your HVDC link and flywheel will absorb the transient. Get them deployed before the next weather system."
    ],
    reward_units: 600,
    trigger_stability_min: 55,
    trigger_turn_min: 6
  },
  {
    id: 'nordic_v1_call_04',
    title: 'Offshore Wind Ramp',
    summary: 'Offshore wind performing above forecast. AI coordination required.',
    dialogue: [
      "Offshore wind has exceeded forecast for the third consecutive quarter. Baltic and North Sea both.",
      "Without AI-coordinated forecasting, this kind of variability creates phantom grid oscillations at scale.",
      "The AI optimizer is what makes the Nordic grid exportable to the rest of Europe."
    ],
    reward_units: 800,
    trigger_stability_min: 72,
    trigger_turn_min: 9
  },
  {
    id: 'nordic_v1_call_05',
    title: 'Nordic Model Certified',
    summary: "Nordic grid has reached peak efficiency. ENTSO-E upgrades export certification.",
    dialogue: [
      "90%+ stability. The Nordic grid is the cleanest and now one of the most stable in the interconnect.",
      "ENTSO-E has upgraded your cross-border export rating. Germany and the UK will draw on this.",
      "This is Nordic Grid Operations, standing down. The hydro reserves are yours to manage."
    ],
    reward_units: 1500,
    trigger_stability_min: 90,
    trigger_turn_min: 12
  },
  // Nordic region calls
  {
    id: 'nordic_v1_region_call_01',
    title: 'Western Corridor Online',
    summary: 'Southern hydropower corridor monitoring live. Dispatcher confirms telemetry.',
    dialogue: [
      "Western monitoring array is live. Telemetry across the Oslo–Gothenburg hydropower corridor is clean.",
      "Control center and transformer readings are nominal across the southern transmission segment.",
      "Central mesh is next — that's where the wind dispatch coordination infrastructure lives."
    ],
    reward_units: 300,
    trigger_stability_min: 26,
    trigger_turn_min: 1
  },
  {
    id: 'nordic_v1_region_call_02',
    title: 'Central Mesh Online',
    summary: 'Mid-grid hydro and wind coordination active. Dispatch routing confirmed.',
    dialogue: [
      "Central coordination is active. Hydro and wind dispatch commands routing across mid-grid.",
      "Frequency coverage is stable. The stack is balancing hydro releases against wind ramp.",
      "Eastern demand zone next — Baltic interconnect and Finnish industrial corridor."
    ],
    reward_units: 500,
    trigger_stability_min: 51,
    trigger_turn_min: 4
  },
  {
    id: 'nordic_v1_region_call_03',
    title: 'Eastern Demand Zone',
    summary: 'Baltic–Finnish corridor stabilized. Full Nordic grid coverage achieved.',
    dialogue: [
      "Eastern demand is stable. Load flow nominal across the Baltic and Finnish industrial corridor.",
      "Flexibility and storage assets are anchoring the eastern sector against weather volatility.",
      "You're approaching ENTSO-E export certification threshold. One final push."
    ],
    reward_units: 700,
    trigger_stability_min: 76,
    trigger_turn_min: 8
  },

  // ─── Germany ───────────────────────────────────────────────────────────────
  {
    id: 'germany_v1_call_01',
    title: 'Energiewende Loading',
    summary: 'Bundesgrid Control connects as Germany enters post-nuclear operation.',
    dialogue: [
      "Bundesgrid Control connecting. You're managing the world's most scrutinized energy transition.",
      "Last nuclear plant is offline. 100% renewable target is within reach — but the grid is structurally fragile.",
      "Deploy your monitoring infrastructure first. Without telemetry, you're flying blind across an 82 GW system."
    ],
    reward_units: 200,
    trigger_stability_min: 0,
    trigger_turn_min: 0
  },
  {
    id: 'germany_v1_call_02',
    title: 'Frequency Anomaly Report',
    summary: "Grid above 60%. Dispatcher warns about nuclear phase-out frequency gaps.",
    dialogue: [
      "Holding at 60%. That's creditable given the frequency anomalies from the nuclear phase-out.",
      "Bavaria is drawing emergency imports. Reserve margins are tighter than they should be at this stage.",
      "Keep incidents addressed. Germany is too many people's last-resort balancing provider to fail."
    ],
    reward_units: 400,
    trigger_stability_min: 60,
    trigger_turn_min: 3
  },
  {
    id: 'germany_v1_call_03',
    title: 'South–North Bottleneck',
    summary: 'Bavaria drawing from north under strain. Transmission corridor at capacity.',
    dialogue: [
      "The south–north corridor is at capacity. Bavaria is pulling hard from northern wind generation.",
      "This is the Energiewende's core structural problem. It was never about generation — it's transmission.",
      "Your HVDC link and flywheel will relieve the bottleneck. Deploy before the next weather event."
    ],
    reward_units: 600,
    trigger_stability_min: 55,
    trigger_turn_min: 6
  },
  {
    id: 'germany_v1_call_04',
    title: 'Duck Curve Event',
    summary: 'Solar midday saturation triggering negative prices. AI coordination required.',
    dialogue: [
      "Solar just exceeded demand in Bavaria. Negative spot prices. Classic mid-day duck curve.",
      "Without AI coordination, the ramp-down as clouds roll in will collapse frequency in under 3 minutes.",
      "The AI Grid Optimizer smooths the duck curve. It's what makes the Energiewende viable at scale."
    ],
    reward_units: 800,
    trigger_stability_min: 72,
    trigger_turn_min: 9
  },
  {
    id: 'germany_v1_call_05',
    title: 'Energiewende Complete',
    summary: "German grid has achieved 90%+ stability on 100% renewables. Export certification approved.",
    dialogue: [
      "90% stability. 100% renewable grid. The Energiewende critics have been answered.",
      "Germany is now a net exporter of clean, stable power. Poland and France are on the receiving end.",
      "Bundesministerium für Wirtschaft has approved Phase 2 export certification.",
      "This is Bundesgrid Control, signing off. The grid belongs to the next generation."
    ],
    reward_units: 1500,
    trigger_stability_min: 90,
    trigger_turn_min: 12
  },
  // Germany region calls
  {
    id: 'germany_v1_region_call_01',
    title: 'Western Corridor Online',
    summary: 'Southern Bavaria corridor monitoring live. Dispatcher confirms telemetry.',
    dialogue: [
      "Western monitoring is online. Southern Bavaria corridor is reading clean voltage profiles.",
      "Control center and transformer nominal across the Munich–Stuttgart transmission segment.",
      "Central coordination next — that's where the south–north bottleneck lives."
    ],
    reward_units: 300,
    trigger_stability_min: 26,
    trigger_turn_min: 1
  },
  {
    id: 'germany_v1_region_call_02',
    title: 'Central Mesh Online',
    summary: 'South–north routing active. Dispatch commands crossing mid-grid.',
    dialogue: [
      "Central mesh is online. South–north dispatch commands routing through mid-grid.",
      "Frequency and forecasting are holding. The German stack is beginning to self-balance.",
      "Eastern demand zone next — Berlin–Dresden industrial corridor. Highest load concentration."
    ],
    reward_units: 500,
    trigger_stability_min: 51,
    trigger_turn_min: 4
  },
  {
    id: 'germany_v1_region_call_03',
    title: 'Eastern Demand Zone',
    summary: 'Berlin–Leipzig corridor stabilized. Full German grid coverage achieved.',
    dialogue: [
      "Eastern demand is stable. Load flow nominal across the Berlin–Leipzig industrial corridor.",
      "Flexibility and interconnect assets are anchoring the eastern sector.",
      "You're approaching European export certification threshold. Final push required."
    ],
    reward_units: 700,
    trigger_stability_min: 76,
    trigger_turn_min: 8
  },

  // ─── European Interconnect ─────────────────────────────────────────────────
  {
    id: 'europe_v1_call_01',
    title: 'Continental Boot',
    summary: 'ENTSO-E Central connects. You are now managing the full Continental European Network.',
    dialogue: [
      "This is ENTSO-E Central. You are now interfacing with the Continental European Network — 520 GW, 35 countries.",
      "A destabilization event in one zone can cascade across 400 million people in under 60 seconds.",
      "Deploy monitoring infrastructure immediately. Any region without telemetry is a continental blind spot."
    ],
    reward_units: 200,
    trigger_stability_min: 0,
    trigger_turn_min: 0
  },
  {
    id: 'europe_v1_call_02',
    title: 'Cross-Border Flow Report',
    summary: "Continental stability above 60%. Loop flow risk emerging between Germany and Austria.",
    dialogue: [
      "Continental stability above 60%. Cross-border flows are within acceptable bounds — for now.",
      "Germany's export surplus is creating a loop flow via Austria. That's how the 2006 cascade started.",
      "Keep reserve margins above threshold. Loop flows are invisible until they aren't."
    ],
    reward_units: 400,
    trigger_stability_min: 60,
    trigger_turn_min: 3
  },
  {
    id: 'europe_v1_call_03',
    title: 'Synchronous Zone Threat',
    summary: 'Cascade risk flags across three synchronous zones. 2006 scenario conditions.',
    dialogue: [
      "Cascade risk flags are active across three synchronous zones simultaneously. This is the 2006 scenario.",
      "A single load trip in one zone is now pulling frequency from all others. The interconnect is a liability.",
      "HVDC and flywheel reserve are mandatory. Deploy them before the next cross-border stress event."
    ],
    reward_units: 600,
    trigger_stability_min: 55,
    trigger_turn_min: 6
  },
  {
    id: 'europe_v1_call_04',
    title: 'Correlated Variability',
    summary: 'Solar and wind variability correlated across all European zones simultaneously.',
    dialogue: [
      "Solar and wind variability is now correlated across Southern and Northern Europe at the same time.",
      "At this scale, no human operator can coordinate dispatch fast enough to prevent oscillation.",
      "The AI optimizer reads pan-European weather correlations in real time. It is not optional at this scale."
    ],
    reward_units: 800,
    trigger_stability_min: 72,
    trigger_turn_min: 9
  },
  {
    id: 'europe_v1_call_05',
    title: 'Continental Stability Achieved',
    summary: "Full Continental European Network has reached 90%+ stability. Historic milestone.",
    dialogue: [
      "90% stability across the Continental European Network. This is a historic milestone.",
      "Every synchronous zone is balanced. Cross-border flows are optimal. The grid is one unified system.",
      "400 million people. One stable grid. You built that.",
      "This is ENTSO-E Central, signing off. The lights stay on — for all of them."
    ],
    reward_units: 1500,
    trigger_stability_min: 90,
    trigger_turn_min: 12
  },
  // European Interconnect region calls
  {
    id: 'europe_v1_region_call_01',
    title: 'Western Corridor Online',
    summary: 'Iberia–France–Benelux Atlantic facade monitoring live.',
    dialogue: [
      "Western monitoring is live. Iberia–France–Benelux corridor telemetry is clean.",
      "Control center and transformer readings nominal across the Atlantic facade.",
      "Central coordination next — that's the DACH zone, load center of the continental grid."
    ],
    reward_units: 300,
    trigger_stability_min: 26,
    trigger_turn_min: 1
  },
  {
    id: 'europe_v1_region_call_02',
    title: 'Central Mesh Online',
    summary: 'DACH mid-grid coordination active. Continental dispatch routing confirmed.',
    dialogue: [
      "Central coordination active. DACH dispatch commands routing across mid-continental grid.",
      "Frequency and forecasting are holding. The continental stack is beginning to self-coordinate.",
      "Eastern demand zone next — Balkans and Eastern Europe. Most exposed to cascade in the interconnect."
    ],
    reward_units: 500,
    trigger_stability_min: 51,
    trigger_turn_min: 4
  },
  {
    id: 'europe_v1_region_call_03',
    title: 'Eastern Demand Zone',
    summary: 'Balkans–Poland corridor stabilized. Full continental coverage achieved.',
    dialogue: [
      "Eastern demand is stable. Load flow nominal across the Balkans–Poland corridor.",
      "Flexibility and reinforcement assets are anchoring the eastern flank against cascade risk.",
      "You're approaching full Continental Interconnect stability. Final threshold ahead."
    ],
    reward_units: 700,
    trigger_stability_min: 76,
    trigger_turn_min: 8
  }
];

// ─── Public accessor ──────────────────────────────────────────────────────────

export const getAvailableDispatchCalls = ({
  scenarioId,
  stabilityPct,
  turnIndex,
  completedIds
}: {
  scenarioId: string;
  stabilityPct: number;
  turnIndex: number;
  completedIds: string[];
}): GridOpsDispatchCallView[] => {
  const completedSet = new Set(completedIds);

  return DISPATCH_CALLS.filter(
    (call) =>
      call.id.startsWith(scenarioId) &&
      stabilityPct >= call.trigger_stability_min &&
      turnIndex >= call.trigger_turn_min
  ).map((call) => ({
    id: call.id,
    title: call.title,
    summary: call.summary,
    dialogue: call.dialogue,
    reward_units: call.reward_units,
    completed: completedSet.has(call.id)
  }));
};

export const getDispatchCallById = (id: string): DispatchCallDefinition | undefined =>
  DISPATCH_CALLS.find((call) => call.id === id);
