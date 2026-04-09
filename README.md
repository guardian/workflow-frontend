# Workflow Frontend

Workflow is the Guardian's content tracking system, part of the Digital CMS. It allows editorial staff to track content through the production pipeline, from commission to publication.

This repository contains the frontend app and its Scala API layer, whilst the backend apps are in a separate repository: [workflow](https://github.com/guardian/workflow).

## Contents

- [Introduction](#1-introduction)
- [Getting Started](#2-getting-started)
- [How It Works](#3-how-it-works)
- [Useful Links](#4-useful-links)
- [Terminology](#5-terminology)

## 1. Introduction

Workflow is used by Guardian editorial staff to manage content in production. Content is represented as "stubs" which are typically analogous to content in Composer and are often linked together. However, stubs can also represent other forms of content such as media atoms.

This repository contains the frontend app as well as its own backend (Scala API layer) which interacts with the [workflow](https://github.com/guardian/workflow) backend app: Datastore.

![workflow demo](./docs/assets/workflow-demo.png)

Frontend features:

- **Dashboard** — a filterable, real-time view of all content in production, with status tracking, assignees, priorities, and due dates.
- **Content/stub management** — create and update content stubs, including metadata such as section, legal status, commissioned length, production office, and planned publication details (newspaper book, page, and digital publication date).
- **Admin interface** — manage editorial desks, sections, and section-to-desk mappings (restricted via the Permissions service).
- **Editorial support teams** — manage and view the status of editorial support staff.
- **Presence indicators** — see who else is viewing the same content in real time (via WebSocket).

## 2. Getting Started

### Prerequisites

- **jenv** (Java version manager)
- **nvm** or **fnm** (Node version manager)
- AWS credentials: `workflow` and `capi` (API Gateway invocation) profiles from Janus

Workflow Frontend needs to talk to a workflow datastore and a preferences datastore. It can use either a local backend or the CODE environment.

### Setup

1. Run the setup script:

   ```sh
   ./scripts/setup.sh
   ```

   This installs Homebrew dependencies (awscli, yarn, gu-scala, dev-nginx, ssm), installs JS dependencies via Yarn, and configures a local nginx proxy mapping `workflow` to port 9090.

2. Download the DEV config:

   ```sh
   ./scripts/fetch-config.sh
   ```

   This downloads configuration from S3 to `~/.gu/workflow-frontend-application.local.conf`.

If you encounter a `Module build failed` error due to Node Sass during setup, run `npm rebuild node-sass`.

### Connecting to a datastore

#### CODE (recommended for most development)

Create an SSH tunnel to a workflow-frontend CODE instance. You will need [ssm-scala](https://github.com/guardian/ssm-scala) installed.

```sh
./scripts/setup-ssh-tunnel.sh
```

#### Local backend

Alternatively, set up the [workflow backend](https://github.com/guardian/workflow) locally and verify it is running:

```sh
curl -is http://localhost:9095/management/healthcheck
```

### Running

```sh
./scripts/start.sh
```

This runs `yarn build-dev` (Webpack in watch mode) and `sbt run` concurrently. Navigate to https://workflow.local.dev-gutools.co.uk.

Optional flags:
- `--debug` — enable JVM remote debugging on port 5005
- `--ship-logs` — enable local log shipping

**Note:** When running locally, some functionality will not work:
- CAPI integration
- Presence indicators
- "Assign to me"

Certain features require running other services locally, e.g. run [atom-workshop](https://github.com/guardian/atom-workshop) locally to test creating Chart atoms through Workflow.

### Testing

```sh
yarn test          # single run
yarn test-watch    # watch mode with auto-rebuild
yarn lint          # ESLint on public/**/**/*.js
```

Backend tests are run via SBT:

```sh
sbt test
```

### Deploying

This project uses continuous deployment on the `main` branch. Merging to `main` triggers a build and deploy via RiffRaff. If you suspect your change hasn't deployed, look for the `Editorial Tools::Workflow::Workflow Frontend` project in RiffRaff.

Deployment is to an auto-scaling group in `eu-west-1`, using an AMI built on Ubuntu 22.04 (Jammy) with Java 11.

### Admin Permissions

The `/admin` path allows management of desks and sections. Access is controlled by the Permissions service — not all Workflow users have admin access.

## 3. How It Works

### Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Scala 2.13, Play Framework 3.0.x |
| Frontend | AngularJS 1.8.3 (primary), React 17 (incremental migration) |
| Styling | SCSS, Bootstrap 3.4.1, Emotion (React components) |
| Build (Scala) | SBT |
| Build (JS) | Webpack 5, TypeScript 4.6, Babel |
| Testing (JS) | Karma, Mocha, Chai, Sinon |
| Testing (Scala) | ScalaTest, ScalaMock |
| Auth | Pan-Domain Auth (panda), HMAC headers |
| Infrastructure | AWS (EC2 auto-scaling, DynamoDB, S3), RiffRaff |

### Architecture

Workflow is split across two repositories:

- **workflow-frontend** (this repo) — the user-facing web application and its Scala API layer.
- **[workflow](https://github.com/guardian/workflow)** (backend) — the data layer and core business logic.

Within this repo, the application has three main components:

#### Scala API server (`app/`)

A Play Framework application that serves the frontend HTML and exposes a REST API (60+ endpoints). Key controllers:

- **Application** — serves the dashboard, editorial support, FAQ, and troubleshooting pages.
- **Api** — the primary REST API for content and stub CRUD (list/create content, update stub properties like status, assignee, priority, due date, legal status, production office, etc.).
- **Admin** — desk and section management (create, delete, assign sections to desks).
- **CAPIService** — proxies requests to the Guardian Content API for preview.
- **PeopleService** — user search for assignee lookups.
- **Login** — Pan-Domain Auth OAuth flow.
- **Management** — healthcheck endpoint.

The server uses `AppLoader` → `AppComponents` for dependency injection (compile-time DI via Play's `BuiltInComponentsFromContext`).

Configuration is assembled from files on the instance (`/etc/gu/*.conf`) and a local override file during development (`~/.gu/workflow-frontend-application.local.conf`). The app reads AWS instance tags to determine its stage (Dev, Code, or Prod) and derives service URLs accordingly.

#### Frontend application (`public/`)

A **hybrid AngularJS/React** single-page application:

- **AngularJS 1.8.3** is the primary framework, using `angular-ui-router` for routing.
- **React 17** components are being incrementally introduced (using `ngcomponent` for Angular↔React bridging and Emotion for styling).
- **Services** (`public/lib/`) handle HTTP communication, polling, caching, date formatting, and integrations with Composer, CAPI, Tag Manager, and Atom services.
- **Components** (`public/components/`) are reusable UI widgets: content list, stub modal, presence indicator, support teams, datetime pickers, etc.
- **Layouts** (`public/layouts/`) contain the major page structures (dashboard, global chrome).

Webpack produces two bundles:
- `app.bundle.js` — the main application
- `admin.bundle.js` — the admin interface

#### Shared library (`common-lib/`)

Scala code shared between this repo and the workflow backend. Contains API client interfaces (StubAPI, SectionsAPI, DesksAPI, etc.), models, and utility code.

### Environment stages

| Stage | URL | Purpose |
|-------|-----|---------|
| Dev | `https://workflow.local.dev-gutools.co.uk` | Local development |
| Code | `https://workflow.code.dev-gutools.co.uk` | Staging / QA |
| Prod | `https://workflow.gutools.co.uk` | Production |

### CI/CD pipeline

The CI build (`scripts/ci.sh`) has two steps:

1. **Frontend build** — installs Node dependencies, runs `yarn build` (production Webpack build).
2. **Backend build** — runs `sbt clean compile test riffRaffNotifyTeamcity`.

On merge to `main`, RiffRaff deploys the artifact to an auto-scaling group using a CloudFormation stack (`Workflow-Frontend`).

## 4. Useful Links

- [Workflow backend](https://github.com/guardian/workflow) — the data layer and core business logic for Workflow.
- [Atom Workshop](https://github.com/guardian/atom-workshop) — used for creating atoms (e.g. charts) through Workflow.
- [Pan-Domain Authentication](https://github.com/guardian/pan-domain-authentication) — the authentication library used across Guardian tools.
- [ssm-scala](https://github.com/guardian/ssm-scala) — required for the SSH tunnel setup script.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — solutions for common local development issues (e.g. AWS auth failures on guest WiFi).

## 5. Terminology

- **Stub** — a content item being tracked in Workflow. A stub represents a story in production and carries metadata such as status, assignee, section, priority, and due date. A stub may or may not have a corresponding piece of content in Composer.
- **Desk** — an editorial team or department (e.g. "News", "Sport"). Desks own sections and are used to filter the dashboard.
- **Section** — an editorial section within a desk (e.g. "UK News", "Football"). Content is assigned to a section.
- **Stage** — the deployment environment: Dev (local), Code (staging), or Prod (production).
- **CAPI** — the Guardian Content API, used to fetch published/preview content metadata.
- **Composer** — the Guardian's content editing tool. Workflow links to Composer for content creation and editing.
- **Presence** — a real-time indicator showing which users are currently viewing or editing the same content, powered by WebSocket connections.
- **Pan-Domain Auth (panda)** — the Guardian's cross-domain authentication system, providing SSO across editorial tools.
- **RiffRaff** — the Guardian's deployment tool, used for continuous deployment from the `main` branch.
- **Production Office** — the geographical office responsible for a piece of content (e.g. UK, US, AU).
