import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import "@/shared/i18n";
import type { AppSettings } from "@/shared/types/proxy";
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
      />,
    );

    expect(screen.queryByRole("combobox", { name: "Theme" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(onSaveSettings).toHaveBeenCalledWith({
      ...settings,
      theme: "dark",
    });
  });

  it("saves the selected language value", async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn(async (_settings: AppSettings) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
      />,
    );

    expect(screen.queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Simplified Chinese" }));
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(onSaveSettings).toHaveBeenCalledWith({
      ...settings,
      language: "zh-CN",
    });
  });

  it("keeps theme and language selectors at content width", () => {
    render(<SettingsPanel settings={settings} onSaveSettings={vi.fn()} />);

    expect(screen.getByRole("tablist", { name: "Theme" })).not.toHaveClass("w-full");
    expect(screen.getByRole("tablist", { name: "Language" })).not.toHaveClass("w-full");
  });

  it("does not render shell integration controls", () => {
    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={vi.fn()}
      />,
    );

    expect(screen.queryByText("Shell integration")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "zsh" })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "bash" })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "PowerShell" })).not.toBeInTheDocument();
  });

  it("saves the edited no_proxy value", async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn(async (_settings: AppSettings) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
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

  it("saves the selected auto launch value", async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn(async (_settings: AppSettings) => {});

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
      />,
    );

    await user.click(screen.getByRole("switch", { name: "Launch at startup" }));
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(onSaveSettings).toHaveBeenCalledWith({
      ...settings,
      autoLaunch: true,
    });
  });

  it("disables the save button while settings are saving", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const onSaveSettings = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <SettingsPanel
        settings={settings}
        onSaveSettings={onSaveSettings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();

    await act(async () => {
      resolveSubmit();
    });
  });
});
