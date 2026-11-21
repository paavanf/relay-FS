// @vitest-environment jsdom
// Dialog.test.jsx
// A dialog is named by its visible title: its aria-labelledby points at the
// DialogTitle's id, so a screen reader says "New roster" as it opens - and
// two dialogs on one page never borrow each other's title.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from './index.js';

function TitledDialog({ title }) {
  return (
    <Dialog isOpen onClose={() => {}}>
      <DialogPanel>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>A line under the title.</DialogDescription>
      </DialogPanel>
    </Dialog>
  );
}

afterEach(cleanup);

describe('a dialog', () => {
  it('is named by its title', () => {
    render(<TitledDialog title="New roster" />);
    const dialog = screen.getByRole('dialog', { name: 'New roster' });
    const title = screen.getByRole('heading', { name: 'New roster' });
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });

  it('keeps its own name when another dialog is open too', () => {
    render(
      <>
        <TitledDialog title="Reject this swap?" />
        <TitledDialog title="Propose this swap?" />
      </>,
    );
    expect(screen.getByRole('dialog', { name: 'Reject this swap?' })).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Propose this swap?' })).toBeTruthy();
  });

  it('renders nothing while closed', () => {
    render(
      <Dialog isOpen={false} onClose={() => {}}>
        <DialogTitle>Hidden</DialogTitle>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
