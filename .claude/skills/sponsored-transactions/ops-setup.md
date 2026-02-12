# Ops Setup: Sponsored Transactions

> **Date**: 2026-02-12
> **Feature**: Gasless V1→V2 Access Token Migration
> **Branch**: `sponsored-migration`

## Summary

We're adding transaction sponsorship so users migrating from V1 to V2 access tokens don't need ADA for fees. The developer wallet pays instead.

This requires new secrets in Google Cloud Secret Manager and updates to Cloud Run service configurations.

## Deployment Order

**Deploy to staging first** — this is the only environment where we can test migration (V1 tokens exist on preprod).

1. Staging (`preprod.app.andamio.io`) — test with James's V1 preprod tokens
2. Prod (`mainnet.app.andamio.io`) — after staging validation

Dev (`dev.app.andamio.io`) cannot test migration (no V1 tokens), but can still have sponsorship configured for future TX types.

---

## New Secrets Required

Create these secrets in **Google Cloud Secret Manager**:

| Secret Name | Description | Sensitive? |
|-------------|-------------|------------|
| `WEB3_SDK_API_KEY` | UTXOS API authentication key | Yes |
| `WEB3_SDK_PRIVATE_KEY` | Developer wallet private key for signing | **Critical** |
| `UTXOS_SPONSORSHIP_ID` | Sponsorship tank identifier | Low |

### Per-Environment Values

Each environment needs its own set of secrets. Values will be provided separately via secure channel.

| Environment | Project | Network |
|-------------|---------|---------|
| Staging | `andamio-staging` | preprod/testnet |
| Prod | `andamio-prod` | mainnet |

---

## Cloud Run Configuration

For each environment's Cloud Run service, mount the secrets as environment variables:

```yaml
# Example Cloud Run env config
env:
  - name: WEB3_SDK_API_KEY
    valueFrom:
      secretKeyRef:
        name: WEB3_SDK_API_KEY
        key: latest
  - name: WEB3_SDK_PRIVATE_KEY
    valueFrom:
      secretKeyRef:
        name: WEB3_SDK_PRIVATE_KEY
        key: latest
  - name: UTXOS_SPONSORSHIP_ID
    valueFrom:
      secretKeyRef:
        name: UTXOS_SPONSORSHIP_ID
        key: latest
```

### Service Account Permissions

The Cloud Run service account needs `Secret Manager Secret Accessor` role for these secrets:

```bash
# Grant access (repeat for each secret)
gcloud secrets add-iam-policy-binding WEB3_SDK_API_KEY \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

---

## GitHub Repository Variables

These are **not secrets** — they're build-time variables stored in GitHub repo settings.

Add to repository variables:

| Variable | Staging | Prod |
|----------|---------|------|
| `STAGING_WEB3_SDK_PROJECT_ID` | `4a606bec-f3b4-49bd-a9e6-ad16f7b81d74` | — |
| `STAGING_WEB3_SDK_NETWORK` | `testnet` | — |
| `PROD_WEB3_SDK_PROJECT_ID` | _(same or different)_ | `4a606bec-f3b4-49bd-a9e6-ad16f7b81d74` |
| `PROD_WEB3_SDK_NETWORK` | — | `mainnet` |

---

## Workflow Updates Needed

The deploy workflows need to pass the new build args. This will be done in the PR:

```yaml
# .github/workflows/deploy-staging.yml
build-args: |
  NEXT_PUBLIC_WEB3_SDK_PROJECT_ID=${{ vars.STAGING_WEB3_SDK_PROJECT_ID }}
  NEXT_PUBLIC_WEB3_SDK_NETWORK=${{ vars.STAGING_WEB3_SDK_NETWORK }}
```

---

## Verification

After setup, verify secrets are accessible:

```bash
# Check secret exists
gcloud secrets describe WEB3_SDK_API_KEY --project=PROJECT_ID

# Check Cloud Run can access (in logs after deploy)
# Look for: "[sponsor-migrate] Transaction sponsorship is not configured"
# If this appears, secrets are not mounted correctly
```

---

## Security Notes

- `WEB3_SDK_PRIVATE_KEY` controls a funded wallet — treat as **critical secret**
- Never log these values
- Rotate keys if compromised
- Monitor sponsorship tank balance in UTXOS dashboard

---

## Contact

- **Dev questions**: Jingles (implementation), James (testing)
- **UTXOS dashboard**: https://utxos.dev/dashboard
- **Feature branch**: `sponsored-migration`

---

## Checklist for Ops

### Staging
- [ ] Create secret: `WEB3_SDK_API_KEY`
- [ ] Create secret: `WEB3_SDK_PRIVATE_KEY`
- [ ] Create secret: `UTXOS_SPONSORSHIP_ID`
- [ ] Grant Cloud Run SA access to all 3 secrets
- [ ] Update Cloud Run service env vars
- [ ] Add GitHub var: `STAGING_WEB3_SDK_PROJECT_ID`
- [ ] Add GitHub var: `STAGING_WEB3_SDK_NETWORK`
- [ ] Notify dev team when ready

### Prod
- [ ] Create secret: `WEB3_SDK_API_KEY`
- [ ] Create secret: `WEB3_SDK_PRIVATE_KEY`
- [ ] Create secret: `UTXOS_SPONSORSHIP_ID`
- [ ] Grant Cloud Run SA access to all 3 secrets
- [ ] Update Cloud Run service env vars
- [ ] Add GitHub var: `PROD_WEB3_SDK_PROJECT_ID`
- [ ] Add GitHub var: `PROD_WEB3_SDK_NETWORK`
- [ ] Notify dev team when ready
