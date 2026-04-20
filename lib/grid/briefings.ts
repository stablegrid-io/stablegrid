/**
 * Educational briefings — one per component. Shown in the FieldReport modal
 * on successful deploy and re-readable from the Field Archive. Copy follows
 * the three-act structure described in educational-briefings.md: BRIEFING
 * (the why), OPERATING PRINCIPLE (the how), HORIZON (what's next).
 */

import type { ComponentSlug } from '@/types/grid';

export interface ComponentBriefing {
  title: string;
  teaser: string;
  briefing: string;
  operatingPrinciple: string[];
  horizon: string;
}

export const BRIEFINGS: Readonly<Record<ComponentSlug, ComponentBriefing>> = {
  'primary-substation': {
    title: 'The Diplomatic Translator',
    teaser:
      'You will understand why the whole grid hinges on a voltage conversion that is also, often, its most exposed organ.',
    briefing:
      "A power plant five hundred kilometres away generates electricity at twenty thousand volts. Your wall socket delivers two hundred and thirty. In between those two numbers is a sequence of controlled voltage transformations, and the first one happens here — at a substation. Without it, the choice is stark: ship power at distribution voltage and lose most of it to line resistance before it arrives, or ship it at transmission voltage and watch it arrive as a plasma event. Substations are the diplomatic translators of the grid. They're also, historically, its most exposed organ. In 2013, unknown attackers fired rifles at a substation in Metcalf, California, for nineteen minutes, disabled seventeen transformers, and escaped. Nobody was caught. The lights stayed on only because operators rerouted load around the damage within minutes.",
    operatingPrinciple: [
      'A substation steps high-voltage transmission power down to the medium voltage used by local distribution networks — typically from hundreds of kilovolts to somewhere between ten and thirty-five. Inside the fence: a bank of power transformers doing the voltage conversion, switchgear to connect and isolate circuits, protective relays watching for faults, and bus bars tying it all together.',
      'The modern substation is, increasingly, a computer network wearing a concrete skin. The IEC 61850 standard replaced miles of copper control wiring with fiber optic Ethernet, letting protective devices talk to each other in milliseconds instead of the hundreds of milliseconds a human could ever react in.',
    ],
    horizon:
      'The current frontier is the sulphur-hexafluoride problem. SF₆ gas has been used for decades to insulate switchgear because it suppresses electrical arcs brilliantly. It is also the most potent greenhouse gas known — with a warming potential over twenty-thousand times that of carbon dioxide. The EU has moved to phase it out. Vacuum and dry-air alternatives now work for medium voltage and are climbing toward the transmission range. Every substation built in the next decade is a bet on which technology wins.',
  },

  'power-transformer': {
    title: 'The Faraday Machine',
    teaser:
      'You will learn why the most reliable heavy machine humans have ever built is also, right now, the quiet bottleneck of the energy transition.',
    briefing:
      'The power transformer is the most reliable heavy machine humanity has ever built. It has no moving parts. It runs continuously for fifty years. Its operating principle was described by Michael Faraday in 1831 and has not been improved upon since. And yet: in 2024, the average lead time to order a new large power transformer passed one hundred and twenty weeks — more than two years, up from fifty weeks before the pandemic. Data center construction, EV charging, and the scramble to electrify everything collided with a supply chain that nobody had thought to stress-test. The transformer shortage is the silent bottleneck of the energy transition, and almost no one outside the industry knows it exists.',
    operatingPrinciple: [
      'A transformer is two coils of wire wrapped around a shared iron core. Alternating current in the first coil — the primary — creates an alternating magnetic flux in the core. That flux passes through the second coil — the secondary — and induces a voltage in it. The ratio of the voltages equals the ratio of the number of turns. Two hundred turns on one side, twenty thousand on the other: a hundredfold step-up. No pistons, no bearings, no friction. Just electromagnetic induction in a tub of mineral oil that also keeps it cool.',
    ],
    horizon:
      'The next generation is the solid-state transformer: the iron core and copper windings replaced by high-frequency power electronics. Solid-state transformers can route power bidirectionally, regulate voltage actively, and talk to the grid at millisecond latency. They are also, currently, ten times more expensive than the steel-and-oil version they would replace — which is why the Faraday machine, nearly two hundred years old, remains on duty.',
  },

  'protective-relay': {
    title: 'The Reflex Arc',
    teaser:
      'You will see why a fault that persists for an extra hundred milliseconds can black out fifty-five million people.',
    briefing:
      'On August 14th, 2003, a protective relay in Ohio failed to trip when it should have. Downstream, a line that had sagged into a tree on a hot afternoon remained energised. Within eight minutes, the fault had propagated through the northeastern United States and central Canada. Fifty-five million people lost power. The blackout exposed a brutal truth about the grid: its stability is only ever as good as the protection devices watching it, and those devices are doing work at speeds the human nervous system cannot match. A fault current can melt copper in fifty milliseconds. A human blink takes three hundred. Relays are the reflex arc of the grid.',
    operatingPrinciple: [
      'A relay watches the current and voltage on a transmission line and compares them to a set of rules — programmed in at commissioning, revisited rarely. When it sees an anomaly it recognises as a fault, it sends a trip signal to a circuit breaker. *Overcurrent*: the current exceeded a threshold. *Distance*: the impedance suggests a short circuit twelve kilometres down the line. *Differential*: the current entering a protected zone does not match the current leaving it.',
      'Modern relays are small computers. They log every event with microsecond timestamps, synchronise to GPS time, and talk to peer relays on other substations using a protocol called GOOSE, which delivers trip messages across Ethernet in under four milliseconds.',
    ],
    horizon:
      'Adaptive protection is the current frontier. Classical relay settings are static — engineered for the worst-case grid topology the line will ever see. With grid conditions now changing faster (renewables ramping up and down, flows reversing as rooftop solar pushes power the wrong way through distribution networks), a static setting is increasingly wrong. Adaptive relays change their own thresholds based on real-time topology. The harder and unsolved question is how to validate that a self-modifying protection system will actually trip when the lightning comes.',
  },

  'circuit-breaker-bank': {
    title: 'Negotiations with Plasma',
    teaser:
      'You will understand why every breaker on the grid is really a negotiation with plasma hotter than the surface of the sun.',
    briefing:
      'Consider the physics of what a circuit breaker must do. Ten thousand amps flow through its closed contacts. A fault occurs. The relay sends a trip signal. The breaker must pull those contacts apart — mechanically, against the full pressure of the arc that immediately forms between them. That arc is, briefly, plasma hotter than the surface of the sun. The breaker has roughly forty milliseconds to extinguish it before the heat welds the contacts back together and the whole apparatus becomes a bomb. This happens somewhere on the grid every few seconds. It is considered routine.',
    operatingPrinciple: [
      "Three strategies, each engineered to break an arc. Oil-filled breakers submerge the contacts so the arc's own heat vaporises the oil and blasts the plasma apart with the expanding gas. SF₆ breakers use a gas that quenches arcs by absorbing free electrons. Vacuum breakers operate in a near-perfect vacuum, where there is simply nothing for the arc to sustain itself through — it collapses almost immediately.",
      "After operating, most breakers attempt an *autoreclose* — they close again after half a second to test whether the fault was transient. Roughly seven out of ten faults on an overhead line are transient: a squirrel, a branch, a lightning strike that's already gone. Autoreclose saves the grid the cost of dispatching a repair crew to clear a fault that cleared itself.",
    ],
    horizon:
      'The solid-state circuit breaker is the long-awaited replacement. It uses silicon carbide semiconductors to interrupt current in microseconds instead of milliseconds — no mechanical contacts, no arc to quench. The problem is that a semiconductor with the blocking voltage of a high-voltage mechanical breaker is still prohibitively expensive. The first domain where solid-state wins is DC grids, because direct current has no natural zero-crossing to help extinguish an arc, and interrupting it mechanically is a nightmare. Which means every offshore HVDC project is also a demonstration site for the circuit breaker of the future.',
  },

  'battery-storage-unit': {
    title: 'The Constraint That Softened',
    teaser:
      'You will understand why the single most important number in the last decade of energy was a cost curve, not a chemistry.',
    briefing:
      'For the first hundred years of electrification, the grid operated under a constraint so absolute that everyone took it for granted: electricity cannot be stored. Generation had to exactly match consumption, every second, forever. The entire architecture of the grid — baseload plants, peaker plants, frequency regulation, spinning reserves — existed to manage the consequences of that constraint. Then, sometime in the late 2010s, the constraint began to soften. Lithium-ion batteries at grid scale started arriving at costs that made them competitive with gas peakers. By 2024, the largest grid battery in the world stored more than two gigawatt-hours. The physics of the grid did not change. The economics did, and the economics of the grid *are* the grid.',
    operatingPrinciple: [
      'A grid-scale battery is a warehouse of lithium iron phosphate cells wired into modules, wired into racks, wired into containers — every container a self-contained energy unit with its own cooling, fire suppression, and battery management system. It charges when power is abundant and cheap (midday solar peak), discharges when power is scarce and expensive (evening ramp). A typical installation earns revenue from four distinct markets simultaneously: arbitrage, frequency regulation, spinning reserve, and capacity.',
      'The battery does not only store energy. It also provides *ancillary services* — the small, fast corrections that keep grid frequency at exactly fifty hertz. A battery can ramp from zero to full output in milliseconds. A gas turbine takes minutes. For frequency regulation, the battery is simply a better machine.',
    ],
    horizon:
      "LFP chemistry — lithium iron phosphate — has quietly displaced the cobalt-heavy NMC chemistry that dominated the 2010s. LFP is cheaper, longer-lived, and does not thermally runaway the way NMC does. China's CATL and BYD now produce most of the world's grid LFP. The next competition is sodium-ion, which uses no lithium at all. And further out: long-duration storage — iron-air batteries that discharge over a hundred hours, aimed at the seasonal storage problem that lithium will never economically solve.",
  },

  'capacitor-bank': {
    title: 'The Water in the Hose',
    teaser:
      'You will understand why half the power flowing through the grid is, in a specific sense, not doing any work at all.',
    briefing:
      "Here is something counterintuitive about alternating current: not all of the power that flows through a wire actually does useful work. Some of it — the *reactive* component — sloshes back and forth between the source and the load, magnetising motor cores and transformer windings, doing nothing externally productive. You can't bill a customer for reactive power. You can't light a room with it. But if you don't supply it, voltage collapses, motors stall, and the grid falls over. It is, more or less, the water in a garden hose. The pressure that makes the work possible, rather than the work itself.",
    operatingPrinciple: [
      "A capacitor stores energy in an electric field, rather than a magnetic one. When the rest of the grid is drawing reactive power (nearly always, because the grid is full of motors and transformers), a capacitor can supply it locally. The alternative is to ship reactive power down transmission lines — which is inefficient, because reactive power doesn't travel well, and the further it has to travel, the more voltage sags along the way.",
      'A capacitor bank, therefore, is a voltage stabiliser by a different name. Place one at the end of a long rural feeder and the voltage on that feeder holds steady. Remove it and the feeder droops — lights dim, motors overheat, things break.',
    ],
    horizon:
      "The static compensator — STATCOM — is the capacitor's dynamic successor. Instead of switching fixed blocks of capacitance in and out, a STATCOM uses power electronics to synthesise reactive power on demand, responding to voltage fluctuations in milliseconds. As the grid fills with renewables (which do not provide the voltage support that a spinning generator naturally does), STATCOMs have become non-optional. A wind farm without one is a wind farm that can't keep its own voltage up.",
  },

  'solar-array': {
    title: "Einstein's Nobel, Cashed In",
    teaser:
      'You will see why the photoelectric effect — not relativity — became the physics that changed the cost of electricity.',
    briefing:
      "In 2010, the levelised cost of solar electricity was around three hundred dollars per megawatt-hour. In 2024, it was under thirty. A ninety-percent reduction in fourteen years — the fastest cost decline of any energy technology in history, faster even than the decline in semiconductors under Moore's law during their best decades. The consequence: in most of the world, in most hours, a new solar farm is now the cheapest source of new electricity, by a margin that is not close. Albert Einstein won the Nobel Prize in 1921 for explaining the photoelectric effect — photons knocking electrons loose from a metal surface. He did not anticipate that, a century later, that effect would be powering cities.",
    operatingPrinciple: [
      "A photovoltaic cell is a slab of silicon doped to create a junction — one side with excess electrons, one side with excess holes. A photon of the right energy strikes the junction, creates an electron-hole pair, and the cell's internal field pushes the electron one way and the hole the other. Connect the two sides through a load and current flows. One cell produces roughly half a volt. Wire sixty of them in series and you have a module. Wire hundreds of modules and you have a string. Wire thousands of strings and you have a utility-scale farm the size of a small city.",
      'The output is DC, but the grid runs on AC. A solar farm therefore lives or dies by its inverters — the devices that convert the DC to AC while also managing voltage, frequency response, and fault behaviour.',
    ],
    horizon:
      "The current frontier is the tandem cell — stacking a thin layer of perovskite on top of traditional silicon. Perovskite absorbs blue light efficiently; silicon absorbs red. Together they capture more of the solar spectrum than either alone. Laboratory tandem cells have exceeded thirty-three percent efficiency, up from silicon's single-junction limit near twenty-six. The challenge is durability: perovskite degrades in humidity, heat, and ultraviolet light — the exact conditions a solar panel spends its life in. Solving that is a multi-billion-dollar race.",
  },

  'wind-turbine-cluster': {
    title: 'The Cathedral in the Air',
    teaser:
      'You will understand why a machine the size of a skyscraper, built to extract energy from air, runs at an efficiency close to the thermodynamic limit.',
    briefing:
      'A modern offshore wind turbine is larger than most people believe. Its blades are longer than a football field. Its hub sits higher than the Statue of Liberty is tall. Each blade weighs around thirty-five tons and is shaped by fluid dynamics so precise that a one-percent change in the twist along its length is the difference between a good turbine and a bad one. It extracts energy from moving air — a fluid roughly a thousand times less dense than water — and converts it to electricity with an efficiency approaching the thermodynamic limit. The theoretical maximum for any device that extracts energy from a fluid flow is fifty-nine-point-three percent. Modern turbines routinely hit fifty.',
    operatingPrinciple: [
      "Wind rotates the blades. The blades rotate a shaft. The shaft drives a generator. In older turbines, a gearbox stepped the slow blade rotation up to the fast rotation a generator needs. In modern direct-drive turbines, the gearbox is gone — replaced by a large-diameter generator that happily turns at the blade's own speed. Fewer moving parts, fewer failure points, lower maintenance cost.",
      "The generator's output is variable — frequency and voltage that fluctuate with the wind. That raw output is never connected to the grid directly. It passes through a power electronic converter that decouples the generator's physics from the grid's, outputting clean fifty-hertz AC regardless of what the wind is doing.",
    ],
    horizon:
      "Floating offshore is the frontier. Most offshore wind today is anchored to the seabed with fixed foundations, which limits installation to waters shallower than sixty meters. Floating platforms lift that restriction and open most of the world's ocean to wind generation — including waters off California, Japan, and the Baltic shelf. The engineering challenge is that a floating turbine is a pendulum the size of a cathedral, and the control systems must keep it pointed into the wind while the platform pitches and rolls. The first commercial-scale floating farms are now operating; the next decade will show whether they scale.",
  },

  'smart-inverter': {
    title: 'The Inertia Problem',
    teaser:
      'You will encounter the most important technology in the energy transition that almost nobody outside the industry has heard of.',
    briefing:
      "Here is the crisis at the heart of the energy transition, and almost no one talks about it. For a hundred years, the grid's stability came from physics — specifically, from the enormous rotating masses of steam turbines at coal, gas, and nuclear plants. Their momentum meant that if demand suddenly jumped, the turbines would slow by a fraction of a hertz, buying operators seconds to respond. This is called *inertia*, and it was not designed into the grid. It was inherent. Solar panels have no inertia. Batteries have no inertia. A grid powered entirely by renewables, connected through conventional inverters, has no inertia at all — it responds to disturbances like a drum skin rather than a flywheel. Push past roughly seventy percent renewables on a conventional grid and it becomes, in a precise technical sense, ungovernable.",
    operatingPrinciple: [
      'A conventional — *grid-following* — inverter takes the AC waveform it sees from the grid and synchronises its output to it. It is, by design, a passenger. If the grid waveform disappears, the inverter has nothing to follow and shuts off.',
      'A *grid-forming* inverter is different. It does not follow the grid; it helps produce it. It behaves like a voltage source — establishing its own stable waveform, providing synthetic inertia through fast active-power response, and actively supporting frequency and voltage during disturbances. In a grid of grid-forming inverters, the system frequency is no longer maintained by spinning masses. It is maintained by control algorithms, running in software, on devices scattered across the network.',
    ],
    horizon:
      'Grid-forming inverters are the single most important technology almost nobody outside the industry has heard of. Without them, there is no path to a high-renewable grid — the inertia problem hard-caps the penetration rate. Australia, with one of the highest renewable shares of any major grid, is the proving ground. Their 2020 blackout in South Australia accelerated the deployment; their grid codes now require grid-forming behaviour on new large installations. Everyone else is watching the experiment and preparing to follow.',
  },

  'control-center': {
    title: 'The Room That Cannot Simulate',
    teaser:
      'You will see inside the strangest workplace humans have ever built — and why every grid operator on Earth is now, explicitly, a target.',
    briefing:
      "A grid control room is one of the strangest workplaces humans have ever built. Operators sit in front of walls of screens showing thousands of data points per second — voltages, currents, frequencies, breaker states, generator outputs — from across a territory the size of a small country. They issue commands that can light or darken millions of homes. They cannot simulate those commands beforehand, because the grid itself is the simulation, and mistakes have consequences measured in hospitals without power and money measured in eight figures per hour. In 2015, a control center in Ukraine was taken offline by a phishing email. The malware — later named BlackEnergy — opened breakers at thirty substations, blacked out two hundred thousand customers, and wiped the operators' screens black while it worked. A year later, a second attack used different malware, designed specifically for grid protocols. Every grid operator on Earth is now, explicitly, a target.",
    operatingPrinciple: [
      "The acronym is SCADA — Supervisory Control and Data Acquisition. A SCADA system pulls telemetry from every substation, every generator, every major switch in its territory, typically once every two to four seconds. That data is too noisy to use directly — sensor readings disagree, some are missing, some are wrong. A mathematical routine called *state estimation* — at its heart, a Kalman filter over the grid's physics equations — reconciles all of it into a single consistent picture of what the grid is actually doing right now.",
      'The operators watch the reconciled picture. When something goes wrong — a line trips, a generator drops — they have procedures, practised in drills, to rebalance the system. The procedures must work in minutes, because the grid does not wait.',
    ],
    horizon:
      "The digital twin is the current ambition: a live, high-fidelity simulation of the entire grid, running in parallel to the real one, letting operators test moves before making them. Machine learning is quietly creeping into load forecasting and fault diagnosis — a one-percent improvement in day-ahead load forecast is worth millions of dollars per year to a large utility. The deeper and unresolved question is how much of the operator's judgement can be automated without losing the thing that makes a human operator valuable in the first place: the ability to be surprised.",
  },
};
