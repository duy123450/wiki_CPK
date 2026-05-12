import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";

vi.mock("@/services/api", () => ({
  AUTH_TOKEN_KEY: "testToken",
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  uploadAvatar: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

const defaultProps = {
  sidebarCollapsed: false,
  currentUser: null,
  onAuthSuccess: vi.fn(),
  onAvatarUpdate: vi.fn(),
  onLogout: vi.fn(),
};

const renderAuthWithRoute = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthPage {...defaultProps} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthPage — Twitter OAuth Integration", () => {
  it("should handle Twitter OAuth callback with accessToken and user data", async () => {
    const mockUser = {
      id: "123",
      username: "twitteruser_4567",
      email: "twitteruser_4567@twitter.local",
      avatar: {
        url: "https://pbs.twimg.com/photo.jpg",
        public_id: "twitter-avatar",
      },
    };
    const mockToken = "twitter-access-token-xyz";

    const { refreshAccessToken } = await import("@/services/api");
    refreshAccessToken.mockResolvedValueOnce({
      user: mockUser,
      accessToken: mockToken,
      token: mockToken,
    });

    const route = `/auth?oauth=success`;
    renderAuthWithRoute(route);

    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).toHaveBeenCalledWith({
        user: mockUser,
        accessToken: mockToken,
        token: mockToken,
      });
    });
  });

  it("should display error on Twitter OAuth failure", async () => {
    const route = "/auth?twitterError=1";
    renderAuthWithRoute(route);

    await waitFor(() => {
      expect(
        screen.getByText("X sign-in was cancelled or failed."),
      ).toBeInTheDocument();
    });
  });

  it("should handle refresh failure gracefully", async () => {
    const { refreshAccessToken } = await import("@/services/api");
    refreshAccessToken.mockRejectedValueOnce(new Error("Failed"));

    const route = `/auth?oauth=success`;
    renderAuthWithRoute(route);

    await waitFor(() => {
      expect(
        screen.getByText("Sign-in failed or expired. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("should differentiate between Google and Twitter errors", async () => {
    const googleRoute = "/auth?googleError=1";
    const { unmount: unmountGoogle } = render(
      <MemoryRouter initialEntries={[googleRoute]}>
        <AuthPage {...defaultProps} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Google sign-in was cancelled or failed."),
      ).toBeInTheDocument();
    });

    unmountGoogle();

    const twitterRoute = "/auth?twitterError=1";
    render(
      <MemoryRouter initialEntries={[twitterRoute]}>
        <AuthPage {...defaultProps} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("X sign-in was cancelled or failed."),
      ).toBeInTheDocument();
    });
  });

  it("should preserve user avatar from Twitter profile", async () => {
    const mockUser = {
      id: "123",
      username: "twitteruser_4567",
      email: "twitteruser_4567@twitter.local",
      avatar: {
        url: "https://pbs.twimg.com/profile_images/xyz.jpg",
        public_id: "twitter-avatar",
      },
    };
    const mockToken = "twitter-token";

    const { refreshAccessToken } = await import("@/services/api");
    refreshAccessToken.mockResolvedValueOnce({
      user: mockUser,
      accessToken: mockToken,
      token: mockToken,
    });

    const route = `/auth?oauth=success`;
    renderAuthWithRoute(route);

    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            avatar: mockUser.avatar,
          }),
        }),
      );
    });
  });

  it("should not call onAuthSuccess if oauth != success", async () => {
    const route = `/auth`;
    renderAuthWithRoute(route);

    await waitFor(() => {
      expect(defaultProps.onAuthSuccess).not.toHaveBeenCalled();
    });
  });

  it("should render Twitter login button on auth page", () => {
    renderAuthWithRoute("/auth");
    // Both Google and Twitter buttons should be present
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with X" }),
    ).toBeInTheDocument();
  });
});
