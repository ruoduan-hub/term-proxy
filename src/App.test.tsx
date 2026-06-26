import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import "./shared/i18n";

describe("App", () => {
  it("renders translated proxy management sections", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Term Proxy" })).toBeInTheDocument();
    expect(screen.getByText("Proxy types")).toBeInTheDocument();
    expect(screen.getByText("Import existing proxy")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add proxy" })).toBeInTheDocument();
    expect(screen.getByText("Shell integration")).toBeInTheDocument();
  });
});
