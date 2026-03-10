# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Cookie consent" [ref=e2]:
    - generic [ref=e3]:
      - heading "Cookies" [level=2] [ref=e4]
      - paragraph [ref=e5]:
        - text: We use cookies to collect data and improve our services.
        - link "Learn more" [ref=e6] [cursor=pointer]:
          - /url: /privacy#cookie-policy
      - generic [ref=e7]:
        - button "Accept" [ref=e8] [cursor=pointer]
        - button "Reject all" [ref=e9] [cursor=pointer]: Opt out
        - button "Privacy settings" [ref=e10] [cursor=pointer]
  - main [ref=e12]:
    - heading "Practice session glitch" [level=1] [ref=e13]
    - paragraph [ref=e14]: Something went sideways while loading this view. Try reloading the session.
    - button "Retry" [ref=e15] [cursor=pointer]
  - alert [ref=e16]
```