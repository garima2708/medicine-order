This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## MCP Server (HTTP Transport)

This project includes an MCP server with Streamable HTTP transport at `/mcp`.

### Run

```bash
pnpm mcp:dev
```

By default it runs on `127.0.0.1:3333`. You can override:

```bash
MCP_HOST=127.0.0.1 MCP_PORT=3333 pnpm mcp:dev
```

For container platforms (Coolify), use host `0.0.0.0` and map the service port:

```bash
MCP_HOST=0.0.0.0 PORT=3333 pnpm mcp:start
```

### Tools

- `GetCart()`
- `UpdateCart(items: [{ medicineId, quantity }])`
- `searchMedicine(medicineName)`

## Deploy on Coolify

- Build source: `Dockerfile` in repo root
- Container port: `3333`
- Health check path: `/health`
- Recommended env vars:
  - `MCP_HOST=0.0.0.0`
  - `PORT=3333`
  - Optional: `MCP_PORT=3333` (if you prefer MCP-specific port var)
