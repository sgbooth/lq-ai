import * as api from "@/features/autonomous/autonomousApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Badge, Button, Card, Checkbox, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";
export const AutonomousNotificationsPage = () => {
  const [unread, setUnread] = useState(true);
  const [offset, setOffset] = useState(0);
  const r = useResource(() => api.listNotifications(unread, 50, offset), [unread, offset], 15000);
  const a = useAction();
  return (
    <FeaturePanel title="Notifications">
      <Checkbox
        label="Unread only"
        checked={unread}
        onChange={(e) => {
          setUnread(e.currentTarget.checked);
          setOffset(0);
        }}
      />
      <ActionFeedback {...a} />
      <ResourcePanel {...r}>
        {r.data?.notifications.map((n) => (
          <Card key={n.id} withBorder mb="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{n.title}</Text>
                <Badge>{n.read_at ? "Read" : "Unread"}</Badge>
              </Group>
              <Text>{n.body}</Text>
              <Group>
                <Anchor component={Link} href={"/autonomous/sessions/" + n.session_id}>
                  View run receipt
                </Anchor>
                {!n.read_at && (
                  <Button
                    variant="light"
                    disabled={a.busy}
                    onClick={() =>
                      void a.run(async () => {
                        await api.readNotification(n.id);
                        r.reload();
                      })
                    }
                  >
                    Mark read
                  </Button>
                )}
                <Text size="xs" c="dimmed">
                  {new Date(n.created_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Card>
        ))}
        {r.data?.notifications.length === 0 && <Text>No notifications.</Text>}
        <PaginationPanel offset={offset} total={r.data?.total_count ?? 0} onChange={setOffset} />
      </ResourcePanel>
    </FeaturePanel>
  );
};
