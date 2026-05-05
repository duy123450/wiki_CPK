import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

describe("ProtectedRoute", () => {
  it("renders children when currentUser exists", () => {
    const mockUser = { id: "1", username: "testuser" };

    render(
      <BrowserRouter>
        <ProtectedRoute currentUser={mockUser}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to /auth when currentUser is null", () => {
    render(
      <BrowserRouter>
        <ProtectedRoute currentUser={null}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to /auth when currentUser is undefined", () => {
    render(
      <BrowserRouter>
        <ProtectedRoute currentUser={undefined}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("preserves user object with email field", () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
      role: "user",
    };

    render(
      <BrowserRouter>
        <ProtectedRoute currentUser={mockUser}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
