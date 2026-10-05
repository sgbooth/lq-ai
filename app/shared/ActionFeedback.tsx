import { Alert } from "@mantine/core";
import type React from "react";
interface Props {
  error: string;
  success?: string;
}
export const ActionFeedback: React.FC<Props> = ({ error, success }) => (
  <>
    {error && (
      <Alert color="red" role="alert">
        {error}
      </Alert>
    )}
    {success && (
      <Alert color="teal" role="status">
        {success}
      </Alert>
    )}
  </>
);
