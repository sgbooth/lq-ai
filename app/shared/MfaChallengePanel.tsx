import { Stack, Text, TextInput } from "@mantine/core";
import type React from "react";
interface Props {
  code: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}
export const MfaChallengePanel: React.FC<Props> = ({ code, onChange, disabled }) => (
  <Stack>
    <Text>Confirm your identity with an authenticator or recovery code.</Text>
    <TextInput
      label="Authenticator or recovery code"
      required
      autoComplete="one-time-code"
      autoFocus
      value={code}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
    />
  </Stack>
);
