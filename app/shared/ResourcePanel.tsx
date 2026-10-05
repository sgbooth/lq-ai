import { Alert, Button, Loader, Stack } from "@mantine/core";
import type React from "react";
interface Props {
  loading: boolean;
  error: string;
  /** Previously loaded data stays visible while a reload is in flight. */
  data?: unknown;
  reload?: () => void;
  children: React.ReactNode;
}
export const ResourcePanel: React.FC<Props> = ({ loading, error, data, reload, children }) =>
  loading && (data === undefined || data === null) ? (
    <Loader aria-label="Loading" />
  ) : error ? (
    <Alert color="red" title="Unable to load" role="alert">
      <Stack gap="sm">
        {error}
        {reload && (
          <Button variant="light" onClick={reload}>
            Try again
          </Button>
        )}
      </Stack>
    </Alert>
  ) : (
    <>{children}</>
  );
