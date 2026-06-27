# Workspace Rules

## Git Workflows

### Git Commit and Push Approvals (NON-NEGOTIABLE)
- **Rule**: You MUST NEVER execute any `git commit` or `git push` commands automatically or arbitrarily.
- **Protocol**: You must first present the planned changes to the user, ask for their explicit permission, and wait for their approval before running any repository-modifying git commands.

## Versioning and Release Workflow

### Semantic Versioning (SemVer)
- **Format**: `MAJOR.MINOR.PATCH` (e.g., `v1.1.0`)
- **Increment Rules**:
  - **PATCH**: Incremented for backwards-compatible bug fixes (e.g., fixing spelling, minor layout spacing, style adjustments).
  - **MINOR**: Incremented for backwards-compatible new features (e.g., adding part of speech badges, pronunciation play buttons, auto-update toasts).
  - **MAJOR**: Incremented for incompatible architectural changes (e.g., changing storage key formats which wipe out local star bookmark lists).

### Release and Verification Protocol
1. **Local Test**: Run `npm test` after editing code to ensure all unit tests pass.
2. **QA Verification**: Start the local server (`python -m http.server 8000`) and prompt the user to test the changes locally via `http://localhost:8000`.
3. **Approval**: Wait for the user to reply with "本地驗證通過" (Local verification passed) before modifying the version tag.
4. **Commit & Push**: Bump the version string in `app.js` and `service-worker.js`, present the changes to the user, and push to GitHub only after obtaining explicit consent.

