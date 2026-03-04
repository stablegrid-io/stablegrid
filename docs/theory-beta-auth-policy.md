# Theory Beta Auth and Access Policy

Last updated: 2026-03-04

This document is the source of truth for route access behavior during the Theory Beta launch.

## Policy summary

- Theory content is readable without authentication.
- User-scoped surfaces and non-theory beta modes require authentication.
- Auth routes (`/login`, `/signup`, `/reset-password`, `/update-password`) redirect authenticated users to `/learn/theory`.

## Route matrix

| Route family | Signed-out behavior | Signed-in behavior | Enforcement |
| --- | --- | --- | --- |
| `/`, `/learn`, `/learn/theory`, `/learn/[topic]/theory/*` | Allowed | Allowed | Server/page behavior |
| `/progress`, `/settings` | Redirect to `/login` | Allowed | Server redirect in page files |
| `/hub/*`, `/missions/*`, `/practice/*`, `/workspace/*`, `/onboarding/*` | Redirect to `/login` | Allowed | `middleware.ts` protected matcher |
| `/login`, `/signup`, `/reset-password`, `/update-password` | Allowed | Redirect to `/learn/theory` | `middleware.ts` auth-route redirect |

## Notes

- This policy intentionally keeps Theory Beta publicly explorable while protecting all user-specific data and unfinished mode surfaces.
- If launch scope changes, update this file and `middleware.ts` in the same PR.
