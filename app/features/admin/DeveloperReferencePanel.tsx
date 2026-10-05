import { getAccessToken } from "@/auth/authSession.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { LQ_AI_API_BASE_URL } from "@/shared/api.ts";
import { Anchor, Button, Card, Code, List, SimpleGrid, Stack, Text, Title } from "@mantine/core";
const backendBase = LQ_AI_API_BASE_URL.replace(/\/api\/v1$/, "");
const gatewayBase = (import.meta.env.VITE_GATEWAY_BASE_URL || "").replace(/\/$/, "");
const referenceLinks = [
  { label: "Swagger UI (backend)", href: `${backendBase}/docs` },
  { label: "ReDoc (backend)", href: `${backendBase}/redoc` },
  { label: "OpenAPI JSON (backend)", href: `${backendBase}/openapi.json` },
  { label: "Backend /metrics", href: `${backendBase}/metrics` },
];
const gatewayLinks = [
  { label: "Swagger UI (gateway)", path: "/docs" },
  { label: "ReDoc (gateway)", path: "/redoc" },
  { label: "OpenAPI JSON (gateway)", path: "/openapi.json" },
  { label: "Gateway /metrics", path: "/metrics" },
];
const repo = "https://github.com/LegalQuants/lq-ai";
const forkLinks = [
  { label: "GitHub repository", href: repo },
  {
    label: "Forkability commitment",
    href: `${repo}/blob/main/docs/PRD.md#10-open-source-and-forkability`,
  },
  {
    label: "Shell coexistence boundary (ADR 0009)",
    href: `${repo}/blob/main/docs/adr/0009-shell-coexistence-boundary.md`,
  },
];
const forkSteps = [
  "Clone the repository and use app/ as your frontend starting point.",
  "Customize the Mantine theme in app/theme.ts.",
  "Set VITE_API_BASE_URL to your backend deployment’s /api/v1 URL.",
  "Build the SPA and deploy with the provided container setup or your own hosting.",
];
export const DeveloperReferencePanel = () => {
  const action = useAction();
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Card withBorder>
        <Stack>
          <Title order={2} size="h3">
            API documentation
          </Title>
          {referenceLinks.map((link) => (
            <Anchor key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </Anchor>
          ))}
          {gatewayBase ? (
            gatewayLinks.map((link) => (
              <Anchor
                key={link.path}
                href={gatewayBase + link.path}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </Anchor>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              Set VITE_GATEWAY_BASE_URL when building the frontend to enable gateway documentation
              and metrics links.
            </Text>
          )}
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2} size="h3">
            API playground
          </Title>
          <Text>
            Copy your current access token into Swagger’s Authorize dialog to make authenticated
            requests. If a request returns 401, sign in again and copy a fresh token.
          </Text>
          <Button
            variant="light"
            disabled={!getAccessToken()}
            onClick={() =>
              void action.run(
                () => navigator.clipboard.writeText(getAccessToken() || ""),
                "Token copied. Paste into Swagger’s Authorize dialog.",
              )
            }
          >
            Copy API access token
          </Button>
          <ActionFeedback {...action} />
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2} size="h3">
            Role management
          </Title>
          <Text>
            Manage users below. Admins manage deployment configuration and users; members use the
            workspace; viewers have read-only access. The server enforces permissions and prevents
            removal of the last admin.
          </Text>
        </Stack>
      </Card>
      <Card withBorder>
        <Stack>
          <Title order={2} size="h3">
            Build your own frontend
          </Title>
          <Text>
            LQ.AI is open source under Apache-2.0. Use the OpenAPI contract to build a frontend for
            your deployment.
          </Text>
          {forkLinks.map((link) => (
            <Anchor key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </Anchor>
          ))}
          <List type="ordered">
            {forkSteps.map((step) => (
              <List.Item key={step}>{step}</List.Item>
            ))}
          </List>
          <Code>npm run build</Code>
        </Stack>
      </Card>
    </SimpleGrid>
  );
};
