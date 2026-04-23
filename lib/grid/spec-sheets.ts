/**
 * Technical spec sheets — one per component. Shown when a user clicks a
 * shop card in the component catalog. Unlike BRIEFINGS (which is narrative
 * three-act educational copy), these are compact reference tables:
 * description, function, and a list of key engineering parameters.
 */

import type { ComponentSlug } from '@/types/grid';

export interface SpecParameter {
  label: string;
  value: string;
}

export interface ComponentSpec {
  description: string;
  function: string;
  parameters: SpecParameter[];
}

export const SPEC_SHEETS: Readonly<Record<ComponentSlug, ComponentSpec>> = {
  'primary-substation': {
    description:
      'An outdoor high-voltage substation: a fenced concrete pad carrying a transformer bank, disconnect switches, lightning arresters, and steel gantries tied to the incoming transmission feeders.',
    function:
      'Terminates a transmission-level feeder and steps it down to the medium voltage used on local distribution circuits. Acts as the physical junction between the long-distance grid and everything downstream of it.',
    parameters: [
      { label: 'Primary voltage', value: '110 kV' },
      { label: 'Secondary voltage', value: '20 kV' },
      { label: 'Rated capacity', value: '40 MVA' },
      { label: 'Transformer count', value: '2 × 20 MVA' },
      { label: 'Bus configuration', value: 'Double busbar' },
      { label: 'Insulation', value: 'SF₆ / air-insulated' },
      { label: 'Footprint', value: '~ 4 000 m²' },
    ],
  },

  'power-transformer': {
    description:
      'Oil-immersed three-phase power transformer with on-load tap changer, radiator-cooled, mounted on a dedicated concrete foundation with bunded oil containment.',
    function:
      'Converts voltage between two levels via magnetic coupling of primary and secondary windings on a shared laminated core. Tap changer trims the secondary voltage to hold it within the statutory band as upstream conditions shift.',
    parameters: [
      { label: 'Rated power', value: '25 MVA' },
      { label: 'Primary voltage', value: '20 kV' },
      { label: 'Secondary voltage', value: '0.4 kV' },
      { label: 'Short-circuit impedance', value: '8 %' },
      { label: 'Cooling', value: 'ONAN / ONAF' },
      { label: 'Tap range', value: '±10 % in 17 steps' },
      { label: 'No-load efficiency', value: '> 99.4 %' },
      { label: 'Design life', value: '50 years' },
    ],
  },

  'protective-relay': {
    description:
      'Microprocessor-based numerical protection relay housed in the substation control cubicle, wired to current transformers and voltage transformers on the protected line.',
    function:
      'Continuously samples current and voltage, compares them against programmed fault signatures (overcurrent, distance, differential), and dispatches a trip command to the associated breaker when an anomaly clears the threshold.',
    parameters: [
      { label: 'Trip time', value: '< 20 ms' },
      { label: 'Sampling rate', value: '4 000 Hz' },
      { label: 'CT input', value: '1 A / 5 A' },
      { label: 'PT input', value: '100 V / 110 V' },
      { label: 'Protocol', value: 'IEC 61850 / GOOSE' },
      { label: 'Time sync', value: 'IRIG-B / PTP' },
      { label: 'Standard', value: 'IEEE C37.90 · IEC 60255' },
    ],
  },

  'circuit-breaker-bank': {
    description:
      'Three-pole outdoor circuit breaker bank mounted on steel support structures, one pole per phase, each pole housing its own interrupter chamber and hydraulic or spring operating mechanism.',
    function:
      'On a trip signal, mechanically separates its contacts and extinguishes the resulting arc inside an SF₆ or vacuum interrupter, isolating the faulted line segment within two cycles and protecting downstream equipment.',
    parameters: [
      { label: 'Rated voltage', value: '24 kV' },
      { label: 'Rated current', value: '2 000 A' },
      { label: 'Short-circuit breaking', value: '25 kA / 3 s' },
      { label: 'Interrupting time', value: '40 ms' },
      { label: 'Interrupting medium', value: 'SF₆' },
      { label: 'Operating mechanism', value: 'Spring-charged' },
      { label: 'Autoreclose', value: '1 × 500 ms dead time' },
      { label: 'Mechanical life', value: '10 000 operations' },
    ],
  },

  'battery-storage-unit': {
    description:
      'Containerised battery energy storage system: lithium-iron-phosphate racks in climate-controlled 20-foot enclosures paired with bidirectional PCS inverters and a medium-voltage step-up transformer.',
    function:
      'Charges when wholesale energy is cheap or renewables overproduce and discharges during the evening peak. Provides fast frequency response, voltage support, and black-start capability for the local feeder.',
    parameters: [
      { label: 'Chemistry', value: 'LFP (LiFePO₄)' },
      { label: 'Energy capacity', value: '4 MWh' },
      { label: 'Rated power', value: '2 MW' },
      { label: 'Duration', value: '2 h' },
      { label: 'Round-trip efficiency', value: '90 %' },
      { label: 'Response time', value: '< 100 ms' },
      { label: 'Cycle life', value: '6 000 cycles @ 80 % DoD' },
      { label: 'Augmentation', value: '15-year plan' },
    ],
  },

  'capacitor-bank': {
    description:
      'Pole- or pad-mounted shunt capacitor bank with three-phase switched sections, vacuum-interrupter contactor, neutral unbalance protection, and surge arresters.',
    function:
      'Injects leading reactive power at the point of connection to counter the lagging reactive draw of motors and transformers, holding local voltage inside the statutory band and reducing line losses.',
    parameters: [
      { label: 'Rated reactive power', value: '3 MVAr' },
      { label: 'Rated voltage', value: '20 kV' },
      { label: 'Switching', value: '3 × 1 MVAr steps' },
      { label: 'Control', value: 'Voltage / time / power-factor' },
      { label: 'Response time', value: '~ 200 ms per step' },
      { label: 'Internal fusing', value: 'Per-can' },
      { label: 'Ambient range', value: '−40 °C to +45 °C' },
    ],
  },

  'solar-array': {
    description:
      'Ground-mounted distributed photovoltaic plant: monocrystalline bifacial modules on fixed-tilt steel racking, string inverters at each block, and a single medium-voltage interconnection transformer.',
    function:
      'Converts incident sunlight directly into DC via the photoelectric effect, then synthesises grid-frequency AC through string inverters that handle MPPT, voltage regulation, and ride-through.',
    parameters: [
      { label: 'Installed capacity', value: '5 MWp DC' },
      { label: 'Inverter capacity', value: '4 MW AC' },
      { label: 'Module type', value: 'Bifacial monocrystalline' },
      { label: 'Module efficiency', value: '22 %' },
      { label: 'Tilt', value: '35° fixed, azimuth 180°' },
      { label: 'Capacity factor', value: '~ 13 % (LT)' },
      { label: 'Annual yield', value: '≈ 5 700 MWh' },
    ],
  },

  'wind-turbine-cluster': {
    description:
      'Cluster of three-bladed direct-drive utility-scale wind turbines on tubular steel towers, each turbine tied into the cluster substation over medium-voltage underground cable.',
    function:
      'Extracts kinetic energy from the wind via aerodynamic lift on the blades, converts rotational energy to electricity through a direct-drive permanent-magnet generator, and exports it through a back-to-back power-electronics converter.',
    parameters: [
      { label: 'Turbine count', value: '4' },
      { label: 'Rated power / turbine', value: '5 MW' },
      { label: 'Cluster capacity', value: '20 MW' },
      { label: 'Rotor diameter', value: '145 m' },
      { label: 'Hub height', value: '110 m' },
      { label: 'Cut-in wind speed', value: '3 m/s' },
      { label: 'Cut-out wind speed', value: '25 m/s' },
      { label: 'Capacity factor', value: '~ 38 % (onshore)' },
    ],
  },

  'smart-inverter': {
    description:
      'Utility-scale grid-forming inverter cabinet with silicon-carbide power modules, liquid cooling, and embedded controller that can source its own voltage reference without needing an upstream grid.',
    function:
      'Synthesises a stable three-phase voltage waveform at the point of connection, provides synthetic inertia and fast frequency response, and rides through grid disturbances while other resources recover.',
    parameters: [
      { label: 'Rated power', value: '2.5 MVA' },
      { label: 'DC voltage range', value: '1 000 – 1 500 V' },
      { label: 'Grid mode', value: 'Grid-forming (GFM)' },
      { label: 'Synthetic inertia', value: 'H ≈ 5 s equivalent' },
      { label: 'Response time', value: '< 10 ms' },
      { label: 'Peak efficiency', value: '98.8 %' },
      { label: 'Communications', value: 'IEC 61850 · Modbus TCP' },
    ],
  },

  'control-center': {
    description:
      'Regional dispatch centre: tiered operator consoles in front of a video wall, redundant SCADA servers in an adjacent rack room, hardened network to every substation in the territory.',
    function:
      'Collects telemetry from every monitored asset, reconciles it into a single state estimate through a Kalman-filter-based solver, and gives operators the tools to dispatch generation, reconfigure the network, and coordinate restoration after a trip.',
    parameters: [
      { label: 'Monitored substations', value: '10' },
      { label: 'Telemetry points', value: '~ 8 000' },
      { label: 'Poll interval', value: '2 s' },
      { label: 'State estimation', value: 'Weighted-least-squares' },
      { label: 'Protocols', value: 'IEC 60870-5-104 · DNP3' },
      { label: 'Redundancy', value: 'Hot-standby, dual site' },
      { label: 'Operator consoles', value: '4' },
      { label: 'Availability target', value: '99.99 %' },
    ],
  },
};
