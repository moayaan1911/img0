# Contributing to img0.xyz

Thanks for helping build img0.xyz.

This project is a non-profit, open-source browser image toolkit. The goal is to keep tools fast, practical, and privacy-friendly.

## Before You Start

- Read the project direction in `AGENTS.md`
- Review existing tools in `src/lib/tools-registry.ts`
- Search for existing issues/PRs before opening a new one

## What You Can Contribute

- New tools
- Bug fixes
- Performance improvements
- Accessibility improvements
- UI/UX improvements
- Documentation updates

## Local Setup

```bash
npm install
npm run lint
npm run build
```

Optional local run:

```bash
npm run dev
```

## Development Rules

- TypeScript strict mode
- Reuse shared components where possible
- Keep logic modular and readable
- Add clear error states for invalid files and processing failures
- Keep UI responsive on mobile and desktop

## Product Constraints

- No paid dependencies/APIs
- No auth/login/signup systems
- No user image uploads to external processing backends
- No tracking-heavy analytics

## How to Add a New Tool

1. Add tool metadata in `src/lib/tools-registry.ts`:
   - `slug`
   - `name`
   - `description`
   - `category`
   - `phase`
2. Create a route:
   - `app/tools/<tool-slug>/page.tsx`
3. Create the tool component under:
   - `src/components/tools/phaseX/`
4. Use shared building blocks where possible:
   - `ImageUploader`
   - `ImagePreview`
   - `DownloadButton`
   - `ProcessingLoader`
5. Add metadata (`title`, `description`) for SEO
6. Validate:
   - `npm run lint`
   - `npm run build`

## Pull Request Checklist

- [ ] Feature works as expected
- [ ] No console/runtime errors
- [ ] Proper empty/loading/error states
- [ ] Mobile-friendly layout
- [ ] Accessibility basics covered (labels, keyboard flow, readable contrast)
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] README/docs updated if needed

## Tool Quality Expectations

- Input validation for file type and size
- No data loss on failure
- Clear user feedback for unsupported browser capabilities
- Predictable output naming
- Download flow always visible and usable

## Reporting Bugs

When opening an issue, include:

- Tool name and route
- Browser and OS
- Steps to reproduce
- Expected result
- Actual result
- Screenshots or short recording (if possible)

## Feature Requests

When suggesting a tool:

- Explain the problem/use-case
- Mention expected input/output formats
- Mention whether it is single-file or batch
- Mention likely browser-side approach/library if known

## Code Style

- Keep changes scoped and focused
- Avoid unrelated refactors in the same PR
- Prefer explicit, descriptive naming
- Avoid introducing heavy dependencies unless necessary

## Questions

Open an issue or start a discussion in the repository:

- [GitHub Repo](https://github.com/moayaan1911/img0)
