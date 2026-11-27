# Troubleshooting

Common issues when setting up and running the Andamio App Template.

---

## Setup Issues

### `npm install` fails

**Check your Node.js version:**
```bash
node --version  # must be 20+
```

If it's below 20, upgrade via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org).

---

### Dev server crashes immediately

Usually a missing or malformed `.env` file.

1. Make sure you copied the example: `cp .env.example .env`
2. Check that `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` and `NEXT_PUBLIC_CARDANO_NETWORK` are set
3. Run `npm run dev` again and check the error message — it will name the missing variable

---

## API & Authentication

### Getting 401 errors in the browser console

Your `ANDAMIO_API_KEY` is missing or invalid.

1. Go to [https://app.andamio.io/api-setup](https://app.andamio.io/api-setup) and generate a key
2. Add it to your `.env`: `ANDAMIO_API_KEY="your-key-here"`
3. Restart the dev server (`Ctrl+C`, then `npm run dev`) — Next.js does not hot-reload `.env` changes

---

### API calls return data on some routes but not others

Check that `NEXT_PUBLIC_CARDANO_NETWORK` matches the network your API key is provisioned for. A `preprod` key won't work against `mainnet` endpoints and vice versa.

---

## Wallet Connection

### No wallet detected / "Connect Wallet" button does nothing

- Make sure you have a Cardano wallet browser extension installed (Eternl, Nami, Flint, Lace, etc.)
- The extension must be **enabled for localhost** — check the extension's site permissions
- Try a hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) after installing the extension

---

### Wallet connects but auth fails

- Make sure your wallet is set to the same network as `NEXT_PUBLIC_CARDANO_NETWORK` (preprod or mainnet)
- If using preprod, your wallet must be switched to the **Preprod** testnet inside the extension settings

---

## Transactions

### Transaction stays in `fetching` state indefinitely

- Check the browser console for a failed POST to the gateway — likely a 401 (bad API key) or 404 (wrong endpoint)
- Verify `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` points to the correct environment

---

### Transaction shows `confirmed` but data doesn't update

This is expected behavior. `confirmed` means the TX is on-chain but the gateway database hasn't synced yet. Wait for `updated` state (~30 seconds) before expecting UI changes. See the [transaction flow in the README](../README.md#how-transactions-work) for details.

---

## TypeScript & Build

### Type errors after pulling latest changes

The API types may be out of sync. Regenerate them:

```bash
npm run generate:types
```

---

### `npm run build` fails but `npm run dev` works

Run the full check first to see all errors:

```bash
npm run check
```

This runs both lint and typecheck and will surface the specific issue.

---

## Still stuck?

- Open an issue: [github.com/Andamio-Platform/andamio-app-template/issues](https://github.com/Andamio-Platform/andamio-app-template/issues)
- Check existing issues — your problem may already have a solution
