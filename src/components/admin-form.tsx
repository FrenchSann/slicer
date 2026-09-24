"use client";
import { useActionState, ReactNode } from "react";
export default function AdminForm({
  action,
  children,
  label = "Enregistrer",
}: {
  action: (
    state: { message: string },
    form: FormData,
  ) => Promise<{ message: string }>;
  children: ReactNode;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  return (
    <form action={formAction}>
      {children}
      <button className="button" disabled={pending}>
        {pending ? "Enregistrement…" : label}
      </button>
      <p role="status" className="form-message">
        {state.message}
      </p>
    </form>
  );
}
