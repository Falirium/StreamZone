'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-white/60 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={variant} size="sm" onClick={handleConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
