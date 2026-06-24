#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const targets = process.argv.slice(2);
const user = process.env.PROTECT_USER || "kameya";
const pass = process.env.PROTECT_PASS || randomBytes(12).toString("base64url");
const oldUser = process.env.PROTECT_OLD_USER || user;
const oldPass = process.env.PROTECT_OLD_PASS || "";
const iterations = 240000;
const salt = randomBytes(16);
const key = pbkdf2Sync(`${user}\n${pass}`, salt, iterations, 32, "sha256");

if (targets.length === 0) {
  console.error("usage: PROTECT_USER=<id> PROTECT_PASS=<pass> [PROTECT_OLD_PASS=<pass>] node scripts/protect-static-route.mjs <html>...");
  process.exit(1);
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function encryptHtml(html) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(html, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(Buffer.concat([encrypted, tag])),
  };
}

function decryptProtectedHtml(html, target) {
  const match = html.match(/<script type="application\/json" id="protected-payload">([\s\S]*?)<\/script>/);
  if (!match) {
    return html;
  }
  if (!oldPass) {
    throw new Error(`${target} is already protected. Set PROTECT_OLD_PASS to re-encrypt it.`);
  }
  const payload = JSON.parse(match[1]);
  const oldKey = pbkdf2Sync(
    `${oldUser}\n${oldPass}`,
    Buffer.from(payload.salt, "base64"),
    payload.iterations,
    32,
    "sha256",
  );
  const packed = Buffer.from(payload.ciphertext, "base64");
  const encrypted = packed.subarray(0, -16);
  const tag = packed.subarray(-16);
  const decipher = createDecipheriv("aes-256-gcm", oldKey, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function buildGate({ title, saltBase64, iv, ciphertext }) {
  const payload = JSON.stringify({ salt: saltBase64, iv, ciphertext, iterations });
  return `<!DOCTYPE html>
<html lang="ja" class="is-auth-checking" data-protected-route="kameya-site">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${escapeHtml(title)} | Access</title>
    <style>
      :root {
        --paper: #f8f5ec;
        --paper-deep: #f1eadc;
        --ink: #1a1a1a;
        --muted: rgba(26, 26, 26, 0.64);
        --line: rgba(26, 26, 26, 0.16);
        --accent: #6b4f3a;
        --accent-soft: rgba(107, 79, 58, 0.12);
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      html.is-auth-checking body,
      html.is-embedded-waiting body {
        background: transparent;
      }
      html.is-auth-checking main,
      html.is-embedded-waiting main {
        opacity: 0;
        pointer-events: none;
      }
      body {
        display: flex;
        min-height: 100dvh;
        align-items: center;
        justify-content: center;
        place-items: center;
        padding: clamp(24px, 6vw, 64px);
        background: var(--paper-deep);
        color: var(--ink);
        font-family: "Hiragino Mincho ProN", "Yu Mincho", serif;
      }
      main {
        width: min(640px, 100%);
        padding: clamp(32px, 5vw, 56px);
        border: 1px solid var(--line);
        background: rgba(248, 245, 236, 0.9);
        transition: opacity 180ms ease;
      }
      .kicker {
        margin: 0 0 16px;
        color: var(--accent);
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 12px;
        font-size: clamp(28px, 3vw, 40px);
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.4;
      }
      p {
        margin: 0 0 28px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.9;
      }
      label {
        display: grid;
        gap: 8px;
        margin: 0 0 16px;
        color: var(--muted);
        font-size: 13px;
      }
      input {
        width: 100%;
        min-height: 48px;
        border: 1px solid var(--line);
        border-radius: 0;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--ink);
        font: 16px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      input:focus {
        border-color: rgba(107, 79, 58, 0.58);
        box-shadow: 0 0 0 3px var(--accent-soft);
        outline: none;
      }
      button {
        width: 100%;
        min-height: 48px;
        margin-top: 8px;
        border: 1px solid var(--accent);
        border-radius: 0;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        font: 600 14px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0.08em;
      }
      button:disabled {
        cursor: wait;
        opacity: 0.7;
      }
      .error {
        min-height: 22px;
        margin: 16px 0 0;
        color: #8a2b1d;
        font: 13px/1.7 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      @media (max-width: 520px) {
        body { padding: 20px; }
        main { padding: 32px 24px; }
        h1 { font-size: 24px; }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="kicker">Private Preview</p>
      <h1>亀屋日本伝統株式会社</h1>
      <p>共有されたIDとPassを入力してください。</p>
      <form id="access-form" autocomplete="off">
        <label>ID<input id="access-id" name="id" type="text" autocomplete="username" required /></label>
        <label>Pass<input id="access-pass" name="pass" type="password" autocomplete="current-password" required /></label>
        <button type="submit">表示</button>
        <div class="error" id="access-error" role="status" aria-live="polite"></div>
      </form>
    </main>
    <script type="application/json" id="protected-payload">${payload.replace(/</g, "\\u003c")}</script>
    <script>
      (() => {
        const payload = JSON.parse(document.getElementById("protected-payload").textContent);
        const storageKey = "kameyaSitePreviewKey";
        const isEmbedded = window.self !== window.top;
        const form = document.getElementById("access-form");
        const idInput = document.getElementById("access-id");
        const passInput = document.getElementById("access-pass");
        const error = document.getElementById("access-error");
        const button = form.querySelector("button");
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        function fromBase64(value) {
          return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
        }

        function toBase64(bytes) {
          let binary = "";
          bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
          return btoa(binary);
        }

        async function deriveKey(id, pass) {
          const baseKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(id + "\\n" + pass),
            "PBKDF2",
            false,
            ["deriveKey"]
          );
          return crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: fromBase64(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
            baseKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
          );
        }

        async function decryptWithKey(key) {
          const packed = fromBase64(payload.ciphertext);
          const body = packed.slice(0, -16);
          const tag = packed.slice(-16);
          const encrypted = new Uint8Array(body.length + tag.length);
          encrypted.set(body);
          encrypted.set(tag, body.length);
          const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: fromBase64(payload.iv), tagLength: 128 },
            key,
            encrypted
          );
          return decoder.decode(plain);
        }

        async function reveal(html) {
          return new Promise((resolve) => {
            window.setTimeout(() => {
              document.open("text/html", "replace");
              document.write(html);
              document.close();
              resolve();
            }, 0);
          });
        }

        async function tryStoredKey() {
          const stored = sessionStorage.getItem(storageKey);
          if (!stored) return false;
          try {
            const key = await crypto.subtle.importKey("raw", fromBase64(stored), "AES-GCM", true, ["decrypt"]);
            await reveal(await decryptWithKey(key));
            return true;
          } catch {
            sessionStorage.removeItem(storageKey);
            return false;
          }
        }

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          error.textContent = "";
          button.disabled = true;
          try {
            const key = await deriveKey(idInput.value.trim(), passInput.value);
            const html = await decryptWithKey(key);
            const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
            sessionStorage.setItem(storageKey, toBase64(rawKey));
            await reveal(html);
          } catch {
            error.textContent = "IDまたはPassが違います。";
            passInput.value = "";
            passInput.focus();
          } finally {
            button.disabled = false;
          }
        });

        (async () => {
          const unlocked = await tryStoredKey();
          if (unlocked) return;
          if (isEmbedded) {
            document.documentElement.classList.remove("is-auth-checking");
            document.documentElement.classList.add("is-embedded-waiting");
            return;
          }
          document.documentElement.classList.remove("is-auth-checking");
          idInput.focus();
        })();
      })();
    </script>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

for (const target of targets) {
  const original = decryptProtectedHtml(readFileSync(target, "utf8"), target);
  const title = "亀屋日本伝統株式会社";
  const encrypted = encryptHtml(original);
  writeFileSync(target, buildGate({ title, saltBase64: toBase64(salt), ...encrypted }));
}

console.log(`Protected ${targets.length} file(s).`);
console.log(`ID: ${user}`);
