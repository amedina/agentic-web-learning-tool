/**
 * External dependencies
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "lucide-react";
import '@testing-library/jest-dom';
/**
 * Internal dependencies
 */
import TooltipIconButton from "../tooltipIconButton";

// Radix UI Tooltip requires a ResizeObserver mock in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("TooltipIconButton", () => {
  it("renders the button with children", () => {
    render(
      <TooltipIconButton tooltip="Settings">
        <Settings data-testid="icon" />
      </TooltipIconButton>
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("contains the accessible sr-only label", () => {
    render(
      <TooltipIconButton tooltip="Settings">
        <Settings />
      </TooltipIconButton>
    );
    // The span with class 'sr-only' should exist
    expect(screen.getByText("Settings")).toHaveClass("sr-only");
  });

  it("shows tooltip content on hover", async () => {
    const user = userEvent.setup();
    render(
      <TooltipIconButton tooltip="Helper Text">
        <Settings />
      </TooltipIconButton>
    );

    const button = screen.getByRole("button");
    await user.hover(button);

    // Radix tooltips render asynchronously
    await waitFor(() => {
      const tooltipContent = screen.getByRole("tooltip", { hidden: true });
      expect(tooltipContent).toHaveTextContent("Helper Text");
    });
  });
});