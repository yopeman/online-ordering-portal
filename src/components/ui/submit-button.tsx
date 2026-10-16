"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";

/** Submit button that reflects the enclosing <form> pending state. */
export function SubmitButton({
  children,
  pendingLabel,
  busy,
  ...props
}: ButtonProps & { pendingLabel?: ReactNode; busy?: boolean }) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || Boolean(busy);

  return (
    <Button
      type="submit"
      {...props}
      loading={pending}
      aria-busy={pending}
      className={props.className}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function FormPending() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner className="h-3.5 w-3.5" />
      <span>…</span>
    </p>
  );
}