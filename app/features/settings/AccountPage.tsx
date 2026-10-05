import { changePassword } from "@/auth/authApi.ts";
import { userAtom } from "@/auth/authAtoms.ts";
import { setUser } from "@/auth/authSession.ts";
import * as account from "@/features/settings/accountApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { apiRequest } from "@/shared/api.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import type { MfaSetupResponse } from "@/shared/types.ts";
import { Alert, Button, Card, Group, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useAtomValue } from "jotai";
import { useState } from "react";
export const AccountPage = () => {
  const user = useAtomValue(userAtom);
  const action = useAction();
  const [current, setCurrent] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deletion, setDeletion] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const job = useResource(
    () => (exportId ? account.getExportJob(exportId) : Promise.resolve(null)),
    [exportId],
    exportId ? 3000 : undefined,
  );
  return (
    <FeaturePanel title="Account">
      <Stack maw={700}>
        <Text>{user?.display_name || user?.email}</Text>
        <ActionFeedback {...action} />
        <Card withBorder>
          <Stack
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(() => changePassword(current, password));
            }}
          >
            <Text fw={600}>Change password</Text>
            <PasswordInput
              label="Current password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.currentTarget.value)}
            />
            <PasswordInput
              label="New password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label="Confirm new password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
            />
            <Button
              type="submit"
              disabled={!password || password !== confirm}
              loading={action.busy}
            >
              Update password
            </Button>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Text fw={600}>Multi-factor authentication</Text>
            <Text>{user?.mfa_enabled ? "Enabled" : "Not enabled"}</Text>
            {!user?.mfa_enabled && !setup && (
              <Button
                onClick={() =>
                  void action.run(async () =>
                    setSetup(
                      await apiRequest<MfaSetupResponse>("/auth/mfa/setup", { method: "POST" }),
                    ),
                  )
                }
              >
                Set up MFA
              </Button>
            )}
            {setup && (
              <>
                <Text>Enter this secret into your authenticator:</Text>
                <Text component="code">{setup.secret}</Text>
                <Text>Save your recovery codes:</Text>
                {setup.recovery_codes.map((c) => (
                  <Text component="code" key={c}>
                    {c}
                  </Text>
                ))}
              </>
            )}
            {(setup || user?.mfa_enabled) && (
              <>
                <TextInput
                  label="Authenticator or recovery code"
                  value={code}
                  onChange={(e) => setCode(e.currentTarget.value)}
                />
                {user?.mfa_enabled && (
                  <PasswordInput
                    label="Password to disable MFA"
                    value={current}
                    onChange={(e) => setCurrent(e.currentTarget.value)}
                  />
                )}
                <Button
                  loading={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      if (user?.mfa_enabled)
                        await apiRequest("/auth/mfa/disable", {
                          method: "POST",
                          body: { password: current, code },
                        });
                      else await apiRequest("/auth/mfa/enable", { method: "POST", body: { code } });
                      if (user) setUser({ ...user, mfa_enabled: !user.mfa_enabled });
                      setSetup(null);
                      setCode("");
                    })
                  }
                >
                  {user?.mfa_enabled ? "Disable MFA" : "Verify and enable MFA"}
                </Button>
              </>
            )}
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Text fw={600}>Export your data</Text>
            <Button
              loading={action.busy}
              onClick={() =>
                void action.run(async () => {
                  setExportId((await account.startExport()).job_id);
                })
              }
            >
              Request export
            </Button>
            {job.data && <Text>Status: {job.data.status}</Text>}
            {job.error && <Alert color="red">{job.error}</Alert>}
            {job.data?.download_url && (
              <Button component="a" href={job.data.download_url}>
                Download export
              </Button>
            )}
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Text fw={600}>Delete account</Text>
            <Text>
              {deletion
                ? "Deletion scheduled for " + new Date(deletion).toLocaleString()
                : "Deletion is scheduled with a grace period."}
            </Text>
            <Group>
              <ConfirmButton
                label="Schedule deletion"
                description="Schedule deletion of your account and associated data?"
                onConfirm={async () => {
                  const result = await account.requestDeletion();
                  setDeletion(result.scheduled_deletion_at);
                }}
              />
              <Button
                variant="light"
                onClick={() =>
                  void action.run(async () => {
                    await account.cancelDeletion();
                    setDeletion(null);
                  }, "Deletion cancelled.")
                }
              >
                Cancel pending deletion
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </FeaturePanel>
  );
};
