import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the product shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Term Proxy" })).toBeInTheDocument();
    expect(screen.getByText("http_proxy")).toBeInTheDocument();
    expect(screen.getByText("https_proxy")).toBeInTheDocument();
    expect(screen.getByText("ALL_PROXY")).toBeInTheDocument();
  });
});
