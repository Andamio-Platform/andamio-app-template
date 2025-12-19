---
name: audit-api-coverage-and-performance
description: Audit the usage of Andamio API endpoints.
---

# Audit API Coverage and Performance

## Introduction

This Andamio T3 App Project is built to be a reference implementation that demonstrates how anyone can use the Andamio APIs. Right now, it is also where we are testing different "sub-systems" of the forthcoming Andamio API.

Your job is to review API coverage and performance given the current state of Andamio API development, which changes frequently.

Your work consists of two distinct phases:
- Phase 1 = Check Coverage: You will read an open-api spec, then confirm that each endpoint in the spec is used in the Andamio T3 App Template.
- Phase 2 = Audit Performance: You will audit the codebase for performance, based on its efficient use of the existing queries, making recommendations for how to refine the API to make it as efficient as possible.

## Rules

1. API endpoints should always be called via custom hooks built on `@tanstack/react-query`
2. API response data should be cached and re-used as often as possible
3. We are iterating via two conflicting goals: "full API usage" and "minimum number of queries". Your job is to show what we have in terms of coverage, and make recommendations for improving the system. By iterating on this process, our two conflicting goals will converge.

## Where We Are Going

Soon, there will be a single Andamio API serving all data to this App Template. Currently, there are three sub-systems in testing. For now, you can ignore the other sub-system APIs in this project (Andamioscan and Atlas Tx API). We will address these sub-systems later. Review [data-sources](./data-sources.md) for a comprehensive overview of the architecture.


## Instructions - Phase 1:

### 1. Pull Andamio API Open API Data

The current Andamio DB API is a subsystem of the Andamio API, but for now, it's all we are concerned about.

Pull the latest `openapi.json` from https://andamio-db-api-343753432212.europe-west1.run.app/openapi.json

If this url returns an error, stop and let the user know.


### 2. Compare to Existing Docs

Look at our local docs files: [data-sources](./data-sources.md), [api-coverage](./api-coverage.md) and [api-endpoint-reference](./api-endpoint-reference.md). These files should match the latest open-api.json file. If there are no inconsistencies, then skip to Step 3.

If there are inconsistencies, add and remove entries from the local docs files until they precisely align with the openapi spec.

### 3. Review Hook Coverage

As you can see in the local docs, our ultimate goal is to be able to show where each API endpoint is used in the T3 App codebase.

Database API calls should only be made via custom hooks. Review the hooks in `src/hooks` to make sure that each endpoint is accessible via a custom hook.

### 4. Review Hook Usage

Search the codebase for each hook, to make sure that it is actually in use.

Confirm that all Types are based on imports from `@andamio/db-api`, which should match the API query params and responses perfectly. If you find an inconsistency, be sure to flag it for review.

### 5. Update Local Docs Files

We should have a table in the local docs that shows:

| API ENDPOINT | HOOK | UX COMPONENT(S) | UX ROUTE(S) |
|--------------|------|-----------------|-------------|

## Instructions - Phase 2:

### 1. Optimize the application

When redundant queries are made, we must address them. Our goal is to re-use query data as often as possible. Clearly, this is at odds with "using every endpoint". That's where you come in as the Expert Efficiency Reviewer.

This app uses `"@tanstack/react-query": "^5.69.0"`, which enables caching, re-use of data, and invalidation of cached data when updates to the DB are made.

We want to use react-query whenever possible. When you see that data is already accessible in the app, replace the redundant query. When any list of data has all the data you need, do not query individual resource endpoints.

### 2. Make Recommendations

Keep a list of redundant and inefficient queries. As a developer who wants to build a high-performance, user-friendly application, do you recommend creating new endpoints in our API, or do you have what you need? Do you recommend removing or refactoring any API endpoints?

## Examples

Claude Code will populate this section of the Skill after refining the process with the user.

## Output Format

- In the Claude Code REPL, show a simple list of changes made and API recommendations
- Save your API Recommendations to a new file: `./api-recommendations-{date}.md`