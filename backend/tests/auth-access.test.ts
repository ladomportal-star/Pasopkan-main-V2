import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasAccountSession, safeLoginReturn } from "../../frontend/src/lib/authAccess.ts";

const auth = vi.hoisted(() => ({
  user: null as null | { id: string; is_anonymous?: boolean },
  token: null as string | null,
  loading: false,
}));
vi.mock("../../frontend/src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../../frontend/src/components/DotsLoader", () => ({ default: () => "Checking session" }));
import RequireAccount from "../../frontend/src/components/RequireAccount.tsx";

const frontendRequire = createRequire(new URL("../../frontend/package.json", import.meta.url));
const { createElement: h } = frontendRequire("react");
const { renderToString } = frontendRequire("react-dom/server");
const { MemoryRouter, Routes, Route } = frontendRequire("react-router-dom");

describe("protected application pages", () => {
  beforeEach(() => {
    auth.user = null;
    auth.token = null;
    auth.loading = false;
  });
  function render(path: string) {
    let mounted = false;
    const DataPage = () => {
      mounted = true;
      return "PROTECTED DATA";
    };
    const html = renderToString(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          Routes,
          null,
          h(Route, { element: h(RequireAccount) }, h(Route, { path: "*", element: h(DataPage) })),
          h(Route, { path: "/login", element: "Sign in" }),
        ),
      ),
    );
    return { html, mounted };
  }
  it.each([
    "/event/one",
    "/checkout",
    "/account",
    "/dashboard",
    "/create?new=1",
    "/admin",
    "/staff-scanner",
    "/organizer",
    "/past-events",
    "/edit-profile",
    "/notifications",
    "/language",
    "/security",
    "/security/2fa",
    "/security/password",
    "/payment-methods",
    "/help",
    "/contact",
    "/about",
    "/terms",
    "/privacy",
    "/unknown-page",
  ])("does not mount data on %s before login", (path) => {
    expect(render(path)).toEqual({ html: "", mounted: false });
  });
  it.each(["/", "/category/festival"])("allows public event discovery at %s", (path) => {
    const html = renderToString(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(Routes, null, h(Route, { path: "*", element: "PUBLIC EVENT CATALOG" })),
      ),
    );
    expect(html).toBe("PUBLIC EVENT CATALOG");
  });
  it("does not flash protected pages while session loading or for anonymous sessions", () => {
    auth.loading = true;
    expect(render("/event/one").mounted).toBe(false);
    auth.loading = false;
    auth.user = { id: "guest", is_anonymous: true };
    auth.token = "guest-token";
    expect(render("/event/one").mounted).toBe(false);
  });
  it("requires both an account and its session and stops rendering after logout", () => {
    auth.token = "stored-token-only";
    expect(render("/").mounted).toBe(false);
    auth.user = { id: "account" };
    expect(render("/").mounted).toBe(true);
    auth.token = null;
    expect(render("/").mounted).toBe(false);
    expect(hasAccountSession({ id: "guest", is_anonymous: true }, "token")).toBe(false);
  });
  it("keeps login reachable", () => {
    expect(render("/login")).toEqual({ html: "Sign in", mounted: false });
  });
  it.each([
    "https://evil.test",
    "//evil.test",
    "/%2f%2fevil.test",
    "/\\evil.test",
    "/login",
    "/register?x=1",
  ])("rejects unsafe or looping login return targets: %s", (target) => {
    expect(safeLoginReturn(target)).toBe("/");
  });
  it("preserves safe local destinations with query and hash", () => {
    expect(safeLoginReturn("/create?new=1#details")).toBe("/create?new=1#details");
  });
});
