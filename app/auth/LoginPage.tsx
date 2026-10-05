import { getBootstrapStatus, login, verifyMfa } from "@/auth/authApi.ts";
import { ApiError, MfaChallengeError } from "@/shared/api.ts";
import { Brand } from "@/shared/Brand.tsx";
import { BrandFooterPanel } from "@/shared/BrandFooterPanel.tsx";
import { Icon } from "@/shared/Icon.tsx";
import { MfaChallengePanel } from "@/shared/MfaChallengePanel.tsx";
import { Alert, Button, Grid, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { safeNext } from "@/auth/authRedirect.ts";
export const LoginPage = () => {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bootstrapHint, setBootstrapHint] = useState("");
  async function submit(event: FormEvent<HTMLElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setBootstrapHint("");
    try {
      const session = mfaToken
        ? await verifyMfa(mfaToken, code.trim())
        : await login({ email: email.trim(), password });
      navigate(
        session.user.must_change_password ? "/change-password" : safeNext(window.location.search),
      );
    } catch (failure) {
      if (failure instanceof MfaChallengeError) {
        setMfaToken(failure.mfaToken);
        setPassword("");
        return;
      }
      setError(
        failure instanceof ApiError
          ? failure.status === 401
            ? "Invalid email or password."
            : failure.message
          : "Unable to connect. Please try again.",
      );
      if (failure instanceof ApiError && failure.status === 401) {
        try {
          const status = await getBootstrapStatus();
          if (status.default_password_active) setBootstrapHint(status.logs_hint);
        } catch {
          /* A failed hint lookup must not hide the login error. */
        }
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Grid component="main" gap={0} mih="100dvh">
      <Grid.Col span={{ base: 12, md: 6 }} bg="teal.9" c="white" p={{ base: "xl", md: 60 }}>
        <Stack justify="space-between" mih={{ base: 300, md: "calc(100dvh - 120px)" }} gap="xl">
          <Brand />
          <Stack gap="lg" maw={490} py="xl">
            <Text size="xs" fw={700} c="teal.2">
              SPACE TO THINK CLEARLY
            </Text>
            <Title order={1} size="h1" fw={400}>
              Your practice.
              <br />
              Your knowledge.
              <br />
              <Text component="em" inherit c="teal.2">
                Working together.
              </Text>
            </Title>
            <Text size="lg" c="teal.1" maw={330}>
              A focused workspace for your matters, research, and the work that comes next.
            </Text>
          </Stack>
          <Text size="xs" c="teal.2" visibleFrom="md">
            LQ.AI / OPEN-SOURCE LEGAL AI
          </Text>
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }} p="xl">
        <Stack
          justify="center"
          align="center"
          mih={{ base: 500, md: "calc(100dvh - 64px)" }}
          gap="xl"
        >
          <Stack component="form" onSubmit={submit} aria-busy={busy} w="100%" maw={390} gap="lg">
            <Text size="xs" fw={700} c="teal">
              WELCOME BACK
            </Text>
            <Title order={2}>Sign in to your workspace</Title>
            <Text c="dimmed" size="sm">
              Use your LQ.AI account to continue.
            </Text>
            {!mfaToken && (
              <>
                <TextInput
                  label="Email address"
                  placeholder="you@yourfirm.com"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  leftSection={<Icon.Email />}
                  disabled={busy}
                  size="md"
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  leftSection={<Icon.Password />}
                  disabled={busy}
                  size="md"
                />
              </>
            )}
            {mfaToken && <MfaChallengePanel code={code} onChange={setCode} disabled={busy} />}
            {error && (
              <Alert color="red" icon={<Icon.Error />} role="alert">
                {error}
              </Alert>
            )}
            {bootstrapHint && (
              <Alert title="First-run deployment?" color="yellow" role="status">
                <Text size="sm">Find the bootstrap admin password in the API container logs:</Text>
                <Text component="code" size="xs">
                  {bootstrapHint}
                </Text>
              </Alert>
            )}
            <Button
              type="submit"
              loading={busy}
              rightSection={<Icon.Continue />}
              size="md"
              fullWidth
            >
              {mfaToken ? "Verify and sign in" : "Sign in"}
            </Button>
            {mfaToken && (
              <Button
                variant="subtle"
                disabled={busy}
                onClick={() => {
                  setMfaToken(null);
                  setCode("");
                  setError("");
                }}
              >
                Use another account
              </Button>
            )}
            <Text c="dimmed" ta="center" size="xs">
              Need access? Contact your workspace administrator.
            </Text>
          </Stack>
          <BrandFooterPanel />
        </Stack>
      </Grid.Col>
    </Grid>
  );
};
