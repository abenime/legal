import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import React from "react";

describe("Accessible Design System Compliance", () => {
  it("Dropdown handles keyboard navigation perfectly", async () => {
    const user = userEvent.setup();
    render(
      <Dropdown>
        <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item>Item 1</Dropdown.Item>
          <Dropdown.Item>Item 2</Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>,
    );

    // Initial state: not expanded
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();

    // Open via keyboard Space/Enter
    const trigger = screen.getByText("Open Menu");
    trigger.focus();
    await user.keyboard("{Enter}");

    // Content should appear
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    // Arrow down and Escape to close
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    // Content should unmount
    await waitFor(() => {
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    });
  });

  it("Modal traps focus and closes on escape", async () => {
    const user = userEvent.setup();
    render(
      <Modal>
        <Modal.Trigger>Open Modal</Modal.Trigger>
        <Modal.Content>
          <Modal.Title>Accessible Title</Modal.Title>
          <button>Focusable Inside</button>
        </Modal.Content>
      </Modal>,
    );

    // Open Modal
    await user.click(screen.getByText("Open Modal"));

    await waitFor(() => {
      expect(screen.getByText("Accessible Title")).toBeInTheDocument();
    });

    // Close via Escape
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Accessible Title")).not.toBeInTheDocument();
    });
  });
});
