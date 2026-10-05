import type { Session } from "@/auth/authTypes.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { MfaChallengeError, request } from "@/shared/api.ts";
import { MfaChallengePanel } from "@/shared/MfaChallengePanel.tsx";
import {
  Alert,
  Button,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
type OfficeBridge = {
  onReady: (callback: () => void) => void;
  context: { ui: { messageParent: (message: string) => void } };
};
const getOffice = () => (window as unknown as { Office?: OfficeBridge }).Office;
export const WordAddinLoginPage = () => {
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false);
  const [bridgeError, setBridgeError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = useAction();
  useEffect(() => {
    let alive = true;
    const init = () =>
      getOffice()?.onReady(() => {
        if (alive) setReady(true);
      });
    let script = document.querySelector<HTMLScriptElement>("script[data-office-bridge]");
    if (getOffice()) init();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
        script.dataset.officeBridge = "true";
        document.head.append(script);
      }
      script.addEventListener("load", init);
      script.addEventListener("error", failed);
    }
    function failed() {
      if (alive)
        setBridgeError(
          "Office.js could not load. Open this page from the LQ.AI Word add-in and try again.",
        );
    }
    return () => {
      alive = false;
      script?.removeEventListener("load", init);
      script?.removeEventListener("error", failed);
    };
  }, []);
  return (
    <Container size="xs" py="xl">
      <Stack>
        <Title order={1}>Sign in to LQ.AI</Title>
        <Text>The Word add-in is requesting access to this deployment.</Text>
        {bridgeError && <Alert color="red">{bridgeError}</Alert>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              let login: Session;
              try {
                login = await request<Session>(mfaToken ? "/auth/mfa/verify" : "/auth/login", {
                  method: "POST",
                  body: JSON.stringify(
                    mfaToken
                      ? { mfa_token: mfaToken, code: code.trim() }
                      : { email: email.trim(), password },
                  ),
                });
              } catch (error) {
                if (error instanceof MfaChallengeError) {
                  setMfaToken(error.mfaToken);
                  setPassword("");
                  return;
                }
                throw error;
              }
              const message = login.user.must_change_password
                ? {
                    type: "oauth-error",
                    reason: "Change your password in the LQ.AI web app, then return to the add-in.",
                  }
                : { type: "oauth-success", login };
              getOffice()!.context.ui.messageParent(JSON.stringify(message));
              setPassword("");
            });
          }}
        >
          <Stack>
            {!mfaToken && (
              <>
                <TextInput
                  label="Email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
              </>
            )}
            {mfaToken && (
              <MfaChallengePanel code={code} onChange={setCode} disabled={action.busy} />
            )}
            <ActionFeedback {...action} />
            <Button type="submit" loading={action.busy} disabled={!ready}>
              Sign in
            </Button>
            {!ready && !bridgeError && (
              <Text size="sm" c="dimmed">
                Waiting for the Office bridge…
              </Text>
            )}
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};
