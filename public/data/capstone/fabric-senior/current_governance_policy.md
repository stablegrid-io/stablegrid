# GridUnion Continental Platform Governance Policy

- **Document:** gu-pol-001
- **Version:** 1.3
- **Last reviewed:** 2025-11-02
- **Owner:** GU Platform Team (Olivia Lund)
- **Status:** Active (pending acquisition-driven rewrite)

---

## §1 Purpose

This policy defines how data products are produced, consumed, governed, and
operated on the GridUnion Continental Fabric tenant. It applies to all
workspaces under the `ws_*` prefix and to all data assets registered in
OneLake.

## §2 Data Classification

All Delta tables and Warehouse tables MUST carry a Microsoft Purview
sensitivity label before being promoted to production. Four labels are
supported:

- **Public** — aggregated statistics suitable for external publication.
- **Internal** — operational data not shared with external parties.
- **Confidential** — regulatory filings, financial data, and personal data
  of NordGrid employees.
- **Restricted** — metering data linked to individual customer accounts.

The producing team chooses the label at the time of table registration. The
GU Compliance team reviews labels quarterly and reclassifies where necessary.

## §3 Schema Changes

A schema change to any production table must follow the three-step workflow:

1. **Classify** the change as additive, type-widening, or breaking.
2. **Review** — a peer engineer on the producing team approves the
   PR containing the schema change.
3. **Deploy** via the normal CI/CD pipeline.

Additive changes use `mergeSchema`. Type-widening changes are evaluated
case-by-case. Breaking changes require the author to notify known consumers
in the #data-platform-announcements Slack channel at least 48 hours before
deployment.

## §4 Capacity and Cost

Each team may provision Fabric items within its assigned workspace without
prior approval, subject to the workspace's attached capacity. The four
production capacities (`cap_f128_de_nl_eng`, `cap_f64_fr_lu_eng`,
`cap_f64_analytics`, `cap_f32_streaming`) are owned by the GU Platform team,
which monitors utilization and files capacity-upgrade requests with finance
when sustained peak utilization exceeds 70% for four consecutive weeks.

Teams are expected to optimise their own workloads. The Platform team
publishes a monthly CU-consumption report broken down by workspace.

## §5 Access Control

Workspace roles (Admin, Member, Contributor, Viewer) are assigned by the
workspace owner. OneLake data access roles are configured per Lakehouse by
the owning team. Row-level security policies are implemented by the team that
owns the table.

New engineers are added to their home team's standard role group by the
Platform team within five business days of their joining.

## §6 Incident Response

Severity-1 and severity-2 incidents are declared by the on-call engineer and
coordinated via the #incidents Slack channel. A written post-mortem is
produced within seven business days and stored in the `incidents/` folder of
the team's SharePoint. The GU Platform team reviews post-mortems monthly and
identifies systemic patterns.

## §7 Change Log

- v1.0 (2024-02-11) — Initial policy for single-country NordGrid platform.
- v1.1 (2024-09-04) — Added §4 after F64-to-F128 upgrade.
- v1.2 (2025-02-17) — Added Restricted classification in §2 after GDPR audit.
- v1.3 (2025-11-02) — Minor clarifications; no substantive changes.

---

*This document was authored when GridUnion was a 4-country, 3-team platform.
As the tenant grows past 12 teams and the acquisition brings the operator
count to 6, we anticipate a substantive rewrite in 2026-Q3.*
