# BadmintonSpot 🏸

The Premium Real-Time Court Reservation Dashboard & Automated Alert System for North Vancouver.

![BadmintonSpot Dashboard](dashboard.png)

---

### Tech Stack

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vite.dev)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)


---

## Value Proposition

NVRC badminton courts are highly competitive and book out within seconds of release. BadmintonSpot acts as a premium, automated reservation concierge. It continuously monitors the booking portal, indexes real-time vacancies, and notifies subscribed players the exact second a court opens up. 

By replacing manual refreshes with automated background tracking, it maximizes court utilization and provides players with a significant scheduling advantage.

---

## Core Features

- **High-Fidelity Visual Dashboard**: A premium, responsive single-page web app built with Vite and React, featuring a signature dark glassmorphic UI styled for modern athletics.
- **Intelligent Time & Date Range Filters**: 
  - Custom English-only date range picker to bypass native browser localization.
  - Scrollable time range picker to bound search parameters precisely by hours and minutes.
- **Multi-Location & Weekday Matching**: Simultaneously monitor and query court availability across all major recreation centres (Delbrook, JBCC, Lions Gate, Parkgate) filtered by day-of-week.
- **Verified Spam-Free Alerts**: Two-step email verification (OTP) ensures only valid, active subscribers receive court openings.
- **Secure One-Click Cancel**: Automated email alerts include individualized, cryptographically secure token links (`unsubscribe_token`) allowing users to safely cancel notifications with one tap.
- **Cross-Platform Time Synchronicity**: Custom backend timezone alignment maps database UTC records directly to the `America/Vancouver` timezone on client devices.
