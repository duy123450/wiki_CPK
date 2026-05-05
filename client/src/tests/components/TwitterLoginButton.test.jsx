import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TwitterLoginButton from "@/components/TwitterLoginButton";

vi.mock("@/services/api", () => ({
  getTwitterLoginUrl: vi.fn(() => "http://localhost:3000/api/v1/wiki/auth/x"),
}));

describe("TwitterLoginButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: "" };
  });

  it("renders the Twitter login button", () => {
    render(<TwitterLoginButton />);

    expect(
      screen.getByRole("button", { name: "Sign in with X" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".auth-google-icon")).toBeInTheDocument();
  });

  it("redirects to the backend Twitter OAuth route", async () => {
    const user = userEvent.setup();
    render(<TwitterLoginButton />);

    await user.click(screen.getByRole("button", { name: "Sign in with X" }));

    expect(window.location.href).toBe(
      "http://localhost:3000/api/v1/wiki/auth/x",
    );
  });

  it("uses Twitter API endpoint URL", () => {
    const { getTwitterLoginUrl } = vi.hoisted(() => ({
      getTwitterLoginUrl: vi.fn(
        () => "http://localhost:3000/api/v1/wiki/auth/x",
      ),
    }));

    vi.doMock("@/services/api", () => ({
      getTwitterLoginUrl,
    }));

    render(<TwitterLoginButton />);
    expect(
      screen.getByRole("button", { name: "Sign in with X" }),
    ).toBeInTheDocument();
  });
});
