import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for wallet authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'tas-wallet-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// GoDaddy masked domain and mobile detection middleware
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const host = req.headers.host || '';
  const referer = req.headers.referer || '';
  
  // Detect mobile device
  const isMobile = /android|iphone|ipod|ipad|mobile|mobi/i.test(userAgent);
  
  // Check if this is a GoDaddy masked domain (talkastranger.com or tasonscan.com)
  const isMaskedDomain = 
    host.includes('talkastranger.com') || 
    host.includes('tasonscan.com') ||
    (referer && (
      referer.includes('talkastranger.com') || 
      referer.includes('tasonscan.com')
    ));
  
  // Log detection for debug purposes
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.path === '/') {
    log(`GoDaddy detection - Mobile: ${isMobile}, MaskedDomain: ${isMaskedDomain}, Host: ${host}, UA: ${userAgent.substring(0, 30)}`);
  }

  // Set custom headers that client JS can detect
  res.setHeader('X-Mobile-Detected', isMobile ? 'true' : 'false');
  res.setHeader('X-Masked-Domain', isMaskedDomain ? 'true' : 'false');
  
  // For HTML responses, inject meta tags for detection on the client
  const originalSend = res.send;
  res.send = function(body) {
    if (typeof body === 'string' && body.includes('<!DOCTYPE html>') && req.method === 'GET') {
      // Add detection meta tags right after the last meta tag
      let modifiedBody = body.replace(
        /<\/head>/,
        `<meta name="x-mobile-detected" content="${isMobile ? 'true' : 'false'}" />
        <meta name="x-masked-domain" content="${isMaskedDomain ? 'true' : 'false'}" />
        </head>`
      );
      
      return originalSend.call(this, modifiedBody);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Skip logging for frequent polling endpoints
    const skipPaths = ['/api/tokens', '/api/prices/current', '/api/prices/history'];
    const shouldSkip = skipPaths.some(skipPath => path.startsWith(skipPath));
    
    if (path.startsWith("/api") && !shouldSkip) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
