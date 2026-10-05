import { changePassword } from "@/auth/authApi.ts";
import { PagePanel } from "@/shared/PagePanel.tsx";
import { Alert, Button, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
export const ChangePasswordPage = () => {
  const [, navigate] = useLocation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      navigate("/login");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Password change failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PagePanel>
      <Stack component="form" gap="lg" onSubmit={submit}>
        <Title order={1}>Set a new password</Title>
        <Text c="dimmed">
          Update your password before entering the workspace. You will sign in again afterward.
        </Text>
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.currentTarget.value)}
          disabled={busy}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.currentTarget.value)}
          disabled={busy}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.currentTarget.value)}
          disabled={busy}
        />
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Button type="submit" loading={busy}>
          Update password
        </Button>
      </Stack>
    </PagePanel>
  );
};
