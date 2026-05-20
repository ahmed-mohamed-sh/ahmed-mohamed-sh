# Agent Handoff: Wildan GitHub Profile README

## Current Goal

The user wants a polished GitHub profile README for `wildanniam` that presents Wildan Syukri Niam as an **AI Researcher & Web3 Builder**. The profile should be fully English, professional, credible for future AI graduate-study plans, and strong enough to sell his builder work in AI agents, Web3 trust, on-chain intelligence, and agentic payments.

## User Preferences

- Language: full English.
- Positioning: **AI Researcher & Web3 Builder**.
- Visual direction: clean premium "Researcher Builder", not noisy cyber/hacker style.
- Contact links for v1: GitHub only for now. Instagram was discussed, but no exact handle was provided, so it was omitted.
- README strategy: hybrid.
  - Curated story, featured projects, focus areas, and research direction are manual.
  - Recent public GitHub activity is auto-updated inside a bounded generated block.

## Implemented Repository

Local path:

```text
/Users/wildanniam/Development/project/github/wildanniam
```

Remote repo:

```text
https://github.com/wildanniam/wildanniam
```

The repo was created and pushed as a public GitHub special profile repository.

Initial commit:

```text
582d2a7 feat: create profile README
```

Default branch:

```text
main
```

## Implemented Files

```text
wildanniam/
├── README.md
├── AGENT_HANDOFF.md
├── assets/
│   ├── header.png
│   └── header.svg
├── data/
│   └── featured-projects.json
├── scripts/
│   └── update-readme.mjs
└── .github/
    └── workflows/
        └── update-readme.yml
```

Important note: this `AGENT_HANDOFF.md` file was created after the initial push and may need to be committed/pushed if the user wants it stored on GitHub.

## README Content Summary

The current README includes:

- Header image: `assets/header.png`
- GitHub badge CTA
- About Me
- Current Focus table
- Featured Work table
- Research Direction
- Tech Stack badges
- Recent Activity generated block

The current positioning copy is:

```text
I am Wildan Syukri Niam, a Telkom University student focused on the intersection of AI agents, Web3 trust, and on-chain intelligence.
```

The research direction emphasizes:

- AI agents that observe state
- tool use
- risk reasoning
- multi-agent coordination
- bounded actions
- transparent evidence
- trustworthy autonomous systems

## Featured Projects

The README highlights exactly these projects:

1. Fradium
   - Repo: `https://github.com/fradiumofficial/fradium`
   - Live: `https://fradium.io`
   - Positioning: AI-powered Web3 trust layer; multi-chain address analysis and AI threat detection.

2. AgentPay
   - Repo: `https://github.com/wildanniam/AgentPay`
   - Live: `https://agent-pay-jet.vercel.app`
   - Positioning: agent-native API payments using x402 and Stellar testnet USDC.

3. Nova AI Wallet
   - Repo: `https://github.com/OfficialNovaAI/nova-wallet`
   - Live: `https://nova-wallet-puce.vercel.app`
   - Positioning: AI wallet orchestration for chat-to-transact and on-chain analysis.

4. Crucible
   - Repo: `https://github.com/antech2-async/crucible`
   - Live: `https://crucible-kappa-gules.vercel.app`
   - Positioning: autonomous agent accountability and coordination.

5. SpecHeal
   - Repo: `https://github.com/antech2-async/SpecHeal`
   - Live: `http://merge-kalau-berani.hackathon.sev-2.com`
   - Positioning: AI-assisted Playwright UI test recovery.

6. PayGate Stellar
   - Repo: `https://github.com/wildanniam/paygate-stellar`
   - Live: `https://paygate-stellar.vercel.app`
   - Positioning: API micropayment middleware concept on Stellar.

## Automation Details

Script:

```text
scripts/update-readme.mjs
```

Purpose:

- Fetches recent public GitHub events for `wildanniam`.
- Converts selected event types into readable markdown bullets.
- Replaces only the bounded README block:

```md
<!-- AUTO:ACTIVITY:START -->
...
<!-- AUTO:ACTIVITY:END -->
```

Supported event types:

- `PushEvent`
- `CreateEvent`
- `PullRequestEvent`
- `IssuesEvent`

Commands already tested:

```bash
node scripts/update-readme.mjs --dry-run
node scripts/update-readme.mjs
```

Workflow:

```text
.github/workflows/update-readme.yml
```

Workflow name:

```text
Update profile README
```

Schedule:

```text
17 1 * * *
```

Also supports manual `workflow_dispatch`.

The workflow uses only first-party GitHub Actions plus a shell commit step; no third-party commit action is required.

## Verification Already Done

These checks passed:

```bash
gh repo view wildanniam/wildanniam --json name,url,visibility,defaultBranchRef
gh workflow list --repo wildanniam/wildanniam
curl -s https://raw.githubusercontent.com/wildanniam/wildanniam/main/README.md
curl -I -s https://raw.githubusercontent.com/wildanniam/wildanniam/main/assets/header.png
```

Facts confirmed:

- Repo exists: `wildanniam/wildanniam`
- Visibility: public
- Default branch: `main`
- Repo is not empty
- Repo is not a fork
- Root `README.md` exists
- Header PNG exists remotely and returns HTTP 200
- Workflow is active
- README renders correctly on the repository page at `https://github.com/wildanniam/wildanniam`

## Current User Issue

The user asked why the profile README does not appear on the main profile Overview page:

```text
https://github.com/wildanniam
```

Screenshot showed the Overview page still displaying pinned repositories and contributions, but not the special profile README.

Important findings:

- The special profile repo appears technically valid:
  - name: `wildanniam`
  - owner: `wildanniam`
  - full name: `wildanniam/wildanniam`
  - public
  - default branch `main`
  - root `README.md`
- The repository page itself renders README content correctly.
- A curl of `https://github.com/wildanniam?tab=overview` did not show the README content at that moment.
- This may be GitHub cache/indexing delay, profile-page refresh delay, or a GitHub UI toggle/condition not visible from API.

Recommended next troubleshooting steps:

1. Wait a few minutes and hard-refresh the profile page.
2. Visit `https://github.com/wildanniam/wildanniam` while logged in and check whether GitHub shows a "Share to profile" or special profile README prompt.
3. Confirm the profile repository remains public and named exactly `wildanniam`.
4. Confirm `README.md` is in the repository root, not inside another folder.
5. Try opening the profile in an incognito/private browser window.
6. If still not appearing, make a tiny README commit to retrigger GitHub indexing.
7. If needed, temporarily simplify README to plain text only to rule out rendering/content issues, then restore the designed version.

## Useful Commands

Check local status:

```bash
cd /Users/wildanniam/Development/project/github/wildanniam
git status --short --branch
```

Run README activity update:

```bash
node scripts/update-readme.mjs --dry-run
node scripts/update-readme.mjs
```

Push handoff file if desired:

```bash
git add AGENT_HANDOFF.md
git commit -m "docs: add agent handoff"
git push
```

Check remote:

```bash
gh repo view wildanniam/wildanniam --json nameWithOwner,visibility,isFork,isEmpty,defaultBranchRef,url
gh workflow list --repo wildanniam/wildanniam
```

Check raw README:

```bash
curl -s https://raw.githubusercontent.com/wildanniam/wildanniam/main/README.md | sed -n '1,120p'
```

## Style Guidance for Future Edits

Keep the README:

- English-only
- concise and professional
- research-forward
- builder-credible
- focused on AI agents and Web3 trust
- not overloaded with badges, stats, or decorative animations

Avoid turning it into:

- a generic fullstack profile
- a noisy badge wall
- a raw auto-generated repo dashboard
- a casual biography without technical positioning

