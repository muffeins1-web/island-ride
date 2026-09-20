import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { recordResendDeliveryEvent } from "../email/delivery";
import { readResendWebhookSecret, verifyResendWebhook } from "../email/resend";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const host = process.env.HOST || "0.0.0.0";

  // CORS — allow specific origins (comma-separated in CORS_ORIGIN env var)
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((o: string) => o.trim())
      .filter(Boolean),
  );

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow the origin if it's in the explicit allowlist, or derive it from
    // known preview URL patterns so dev/staging environments work automatically.
    const isAllowed =
      origin &&
      (allowedOrigins.has(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        // Manus preview subdomains share the same parent domain
        (process.env.EXPO_WEB_PREVIEW_URL &&
          new URL(process.env.EXPO_WEB_PREVIEW_URL).hostname.split(".").slice(-2).join(".") ===
            new URL(origin).hostname.split(".").slice(-2).join(".")));

    if (isAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.post(
    "/api/webhooks/resend",
    express.raw({ type: "application/json", limit: "128kb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Webhook body must be raw JSON" });
        return;
      }
      let secret: string;
      try {
        secret = readResendWebhookSecret();
      } catch {
        res.status(503).json({ error: "Email webhook is not configured" });
        return;
      }
      let event;
      try {
        event = verifyResendWebhook(
          req.body,
          {
            id: req.header("svix-id") || undefined,
            timestamp: req.header("svix-timestamp") || undefined,
            signature: req.header("svix-signature") || undefined,
          },
          secret,
        );
      } catch {
        res.status(400).json({ error: "Invalid Resend webhook" });
        return;
      }
      try {
        await recordResendDeliveryEvent(event);
        res.status(204).end();
      } catch (error) {
        console.error("[email] Unable to persist Resend delivery event", error);
        res.status(503).json({ error: "Email event persistence is unavailable" });
      }
    },
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, host, () => {
    console.log(`[api] server listening on http://${host}:${port}`);
  });
}

startServer().catch(console.error);
