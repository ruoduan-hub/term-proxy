import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import "@/shared/i18n";
import type { AppSettings, ShellKind } from "@/shared/types/proxy";
import { SettingsPanel } from "./SettingsPanel";

const settings: AppSettings = {
  theme: "system",
  language: "system",
  autoLaunch: false,
  noProxy: "localhost,127.0.0.1",
  shellIntegration: {
    zsh: false,
    bash: true,
    powershell: false,
  },
};

describe("SettingsPanel", () => {
  it("saves the selected theme value", async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn(async (_settings: AppSettings) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
        onToggleShellIntegration={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Theme"), "dark");
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(onSaveSettings).toHaveBeenCalledWith({
      ...settings,
      theme: "dark",
    });
  });

  it("renders shell integration switches from settings", () => {
    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={vi.fn()}
        onToggleShellIntegration={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "zsh" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("switch", { name: "bash" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("switch", { name: "PowerShell" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("requests shell integration toggle with the next state", async () => {
    const user = userEvent.setup();
    const onToggleShellIntegration = vi.fn(async (_shell: ShellKind, _enabled: boolean) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={vi.fn()}
        onToggleShellIntegration={onToggleShellIntegration}
      />,
    );

    await user.click(screen.getByRole("switch", { name: "zsh" }));

    expect(onToggleShellIntegration).toHaveBeenCalledWith("zsh" satisfies ShellKind, true);
  });

  it("saves the edited no_proxy value", async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn(async (_settings: AppSettings) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
        onToggleShellIntegration={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText("Global no_proxy"));
    await user.type(screen.getByLabelText("Global no_proxy"), "localhost,127.0.0.1,*.local");
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(onSaveSettings).toHaveBeenCalledWith({
      ...settings,
      noProxy: "localhost,127.0.0.1,*.local",
    });
  });
});
