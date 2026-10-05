import {
  orchestrationApi,
  orchestrationChatApi,
  shouldPollTree,
} from "@/features/autonomous/orchestrationApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
interface Props {
  id?: string;
}
export const OrchestrationChatPage: React.FC<Props> = ({ id }) => {
  const [, navigate] = useLocation();
  const [goal, setGoal] = useState("");
  const [terminal, setTerminal] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const action = useAction();
  const caps = useResource(() => orchestrationChatApi.capabilities(), []);
  const run = useResource(
    async (signal) => {
      if (!id) return null;
      const data = await orchestrationChatApi.read(id, signal);
      setTerminal(!shouldPollTree(data.status));
      return data;
    },
    [id],
    id && !terminal ? 3000 : undefined,
  );
  const tree = run.data?.tree;
  const tasks = tree ? [tree.root, ...tree.children] : [];
  return (
    <FeaturePanel
      title="Orchestration"
      description="Review a plan, approve its budget, and inspect each task’s work."
    >
      <Alert color="orange">
        Experimental model demo. Results are unverified and require human review.
      </Alert>
      <ActionFeedback {...action} />
      {!id ? (
        <ResourcePanel {...caps}>
          <Stack maw={800}>
            <Text>{caps.data?.title}</Text>
            <Text>
              Model: {caps.data?.model} · budget: ${caps.data?.budget_usd} · matter:{" "}
              {caps.data?.project_name}
            </Text>
            {caps.data?.packet && (
              <Card withBorder>
                <MarkdownPanel content={caps.data.packet} />
              </Card>
            )}
            <Textarea
              label="Goal"
              autosize
              minRows={5}
              maxLength={10000}
              value={goal}
              onChange={(e) => setGoal(e.currentTarget.value)}
            />
            <Button
              disabled={!caps.data?.enabled || !caps.data.project_id || !goal.trim()}
              loading={action.busy}
              onClick={() =>
                void action.run(async () => {
                  const result = await orchestrationChatApi.start({
                    request_id: crypto.randomUUID(),
                    project_id: caps.data!.project_id!,
                    goal: goal.trim(),
                  });
                  navigate("/autonomous/orchestration/chat/" + result.root_id);
                })
              }
            >
              Start planning
            </Button>
            {!caps.data?.enabled && (
              <Text c="dimmed">This deployment has not enabled the orchestration demo.</Text>
            )}
          </Stack>
        </ResourcePanel>
      ) : (
        <ResourcePanel {...run}>
          {run.data && (
            <Stack>
              <Group>
                <Badge>{run.data.status}</Badge>
                <Text>
                  Spent ${run.data.spent_usd} · reserved ${run.data.reserved_usd}
                </Text>
                <Button variant="default" component={Link} href="/autonomous/orchestration/chat">
                  New plan
                </Button>
                {!terminal && (
                  <ConfirmButton
                    label="Halt orchestration"
                    description="Stop this plan and all its child tasks. Work already completed remains inspectable."
                    onConfirm={async () => {
                      await orchestrationChatApi.halt(id);
                      run.reload();
                    }}
                  />
                )}
              </Group>
              {run.data.stop_reason && <Alert>{run.data.stop_reason}</Alert>}
              <Text>{run.data.planning.goal}</Text>
              {tree && (
                <>
                  <Title order={3}>Plan revision {tree.plan.revision}</Title>
                  <Text>
                    Budget ${tree.plan.budget_usd} · root allowance ${tree.plan.root_allowance_usd}{" "}
                    · maximum active children {tree.plan.max_active_children}
                  </Text>
                  <Text size="sm">Deadline: {new Date(tree.plan.deadline).toLocaleString()}</Text>
                  {tree.plan.children.map((child) => (
                    <Card key={child.dispatch_id} withBorder>
                      <Stack gap="xs">
                        <Text fw={600}>{child.task.topic}</Text>
                        <Text>{child.task.question}</Text>
                        <Text size="sm">Boundaries: {child.task.boundaries}</Text>
                        <Text size="sm">Output: {child.task.output_contract}</Text>
                        <Text size="sm">Stop when: {child.task.stopping_condition}</Text>
                        <Text>Allocation ${child.budget_usd}</Text>
                      </Stack>
                    </Card>
                  ))}
                  {!tree.approved && tree.status === "awaiting_approval" && (
                    <Group>
                      <ConfirmButton
                        color="teal"
                        label="Approve plan"
                        description={`Authorize this plan revision and its $${tree.plan.budget_usd} budget.`}
                        onConfirm={async () => {
                          await orchestrationApi.approve(tree);
                          run.reload();
                        }}
                      />
                      <ConfirmButton
                        label="Reject plan"
                        description="Reject this plan without starting the proposed tasks."
                        onConfirm={async () => {
                          await orchestrationApi.reject(tree);
                          run.reload();
                        }}
                      />
                    </Group>
                  )}
                  <Title order={3}>Task progress</Title>
                  {tasks.map((task) => (
                    <Card key={task.session_id} withBorder>
                      <Stack>
                        <Group>
                          <Badge>{task.status}</Badge>
                          <Text>{task.phase}</Text>
                          <Text>
                            ${task.spent_usd} / ${task.allocation_usd}
                          </Text>
                        </Group>
                        {task.outcome && (
                          <>
                            <MarkdownPanel content={task.outcome.summary} />
                            {task.outcome.findings.map((finding, i) => (
                              <Text key={i}>{finding}</Text>
                            ))}
                            {task.outcome.failure_code && (
                              <Alert color="red">{task.outcome.failure_code}</Alert>
                            )}
                          </>
                        )}
                        {task.effects.map((effect) => (
                          <Text key={effect.effect_key} size="sm">
                            {effect.intent || effect.effect_key}: {effect.status} · charged $
                            {effect.charged_usd ?? "0"} · reserved ${effect.reserved_usd}
                          </Text>
                        ))}
                        {task.files.map((f) => (
                          <Anchor
                            component="button"
                            key={f.name}
                            onClick={() =>
                              void action.run(async () => {
                                const result = await orchestrationApi.file(
                                  tree.root_id,
                                  task.session_id,
                                  f.name,
                                );
                                setFile(result);
                              })
                            }
                          >
                            {f.name} · revision {f.revision} · {f.size_bytes} bytes
                          </Anchor>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                  {tree.result && (
                    <Card withBorder>
                      <Text fw={600}>Synthesis · {tree.result.coverage}</Text>
                      <MarkdownPanel content={tree.result.summary} />
                    </Card>
                  )}
                  {tree.partial_summary && <MarkdownPanel content={tree.partial_summary} />}
                </>
              )}
            </Stack>
          )}
        </ResourcePanel>
      )}
      <Modal opened={!!file} onClose={() => setFile(null)} title={file?.name} size="xl">
        <MarkdownPanel content={file?.content ?? ""} />
      </Modal>
    </FeaturePanel>
  );
};
