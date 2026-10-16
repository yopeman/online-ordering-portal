"use client";

import { useState, type ReactNode } from "react";

import { Button } from "./button";
import { Modal } from "./modal";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  trigger: ReactNode;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
            <Button variant="danger" onClick={handleConfirm} loading={pending}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{description}</p>
      </Modal>
    </>
  );
}