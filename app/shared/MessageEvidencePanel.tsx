import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { StatusBadge } from "@/shared/StatusBadge.tsx";
import { getMessageCitations } from "@/shared/chat/citationsApi.ts";
import { getChatLedger } from "@/shared/chat/ledgerApi.ts";
import {
  exportChatReceiptsJsonl,
  listChatReceipts,
  type ReceiptEventKind,
} from "@/shared/chat/receiptsApi.ts";
import { getMessageSources } from "@/shared/chat/sourcesApi.ts";
import { formatCitingRef, treatmentSummary } from "@/shared/chat/treatmentDisplay.ts";
import { inferenceTiers, tierLabel } from "@/shared/inferenceTiers.ts";
import { download } from "@/shared/download.ts";
import type { Message } from "@/shared/types.ts";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  MultiSelect,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import type React from "react";
import { useState } from "react";

const evidenceTabs = ["citations", "sources", "ledger", "receipts"];

interface Props {
  message: Message;
  initialTab?: "citations" | "sources" | "ledger" | "receipts";
}
const kinds: ReceiptEventKind[] = ["message", "inference", "audit", "skill", "retrieval", "error"];
export const MessageEvidencePanel: React.FC<Props> = ({ message, initialTab = "citations" }) => {
  const [tab, setTab] = useState<string | null>(initialTab);
  const [filter, setFilter] = useState<string[]>([]);
  const action = useAction();
  const citations = useResource(
    () => getMessageCitations(message.chat_id, message.id),
    [message.id],
  );
  const sources = useResource(
    () =>
      tab === "sources" ? getMessageSources(message.chat_id, message.id) : Promise.resolve([]),
    [message.id, tab],
  );
  const ledger = useResource(
    () => (tab === "ledger" ? getChatLedger(message.chat_id, message.id) : Promise.resolve(null)),
    [message.id, tab],
  );
  const receipts = useResource(
    () =>
      tab === "receipts"
        ? listChatReceipts(message.chat_id, filter as ReceiptEventKind[])
        : Promise.resolve([]),
    [message.chat_id, tab, filter.join(",")],
  );
  return (
    <Stack>
      <Text fw={600}>{tierLabel(message.routed_inference_tier)}</Text>
      <Text size="sm">
        {inferenceTiers[message.routed_inference_tier ?? 0]?.description ||
          "This message did not record a data-handling tier."}
      </Text>
      {message.cost_estimate != null && (
        <Text size="sm">Estimated cost: ${message.cost_estimate.toFixed(4)}</Text>
      )}
      <Text>Requested: {message.requested_model || "—"}</Text>
      <Text>
        Routed: {message.routed_provider || "—"} / {message.routed_model || "—"} · Tier{" "}
        {message.routed_inference_tier || "—"}
      </Text>
      <Text>
        {message.prompt_tokens || 0} input · {message.completion_tokens || 0} output tokens
      </Text>
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          {evidenceTabs.map((t) => (
            <Tabs.Tab key={t} value={t}>
              {t}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="citations" pt="md">
          <ResourcePanel {...citations}>
            <Stack>
              {citations.data?.map((c) => (
                <Card withBorder key={c.id}>
                  <Stack gap="xs">
                    <StatusBadge
                      status={c.verified ? (c.partial ? "partial" : "verified") : "unverified"}
                    />
                    <Text>{c.source_text}</Text>
                    <Text size="xs">
                      Page {c.source_page || "—"} · {c.verification_method}
                    </Text>
                  </Stack>
                </Card>
              ))}
              {citations.data?.length === 0 && (
                <Text c="dimmed">No document citations for this turn.</Text>
              )}
            </Stack>
          </ResourcePanel>
        </Tabs.Panel>
        <Tabs.Panel value="sources" pt="md">
          <ResourcePanel {...sources}>
            <Stack>
              {sources.data?.map((s) => (
                <Card key={s.id} withBorder>
                  <Stack gap="xs">
                    <Group>
                      <Badge variant="light">{s.source_kind}</Badge>
                      <Badge variant="outline">
                        {s.provider} / {s.tool}
                      </Badge>
                    </Group>
                    {s.url && /^https?:\/\//i.test(s.url) ? (
                      <Anchor href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </Anchor>
                    ) : (
                      <Text fw={600}>{s.label}</Text>
                    )}
                    {s.subtitle && <Text size="sm">{s.subtitle}</Text>}
                    {s.external_ref && <Text size="xs">{s.external_ref}</Text>}
                  </Stack>
                </Card>
              ))}
              {sources.data?.length === 0 && (
                <Text c="dimmed">No external sources for this turn.</Text>
              )}
            </Stack>
          </ResourcePanel>
        </Tabs.Panel>
        <Tabs.Panel value="ledger" pt="md">
          <ResourcePanel {...ledger}>
            <Stack>
              {ledger.data?.gates.map((g) => (
                <Alert
                  key={g.message_id}
                  color={g.gate_status === "flagged" ? "orange" : "teal"}
                  title={g.gate_status.replaceAll("_", " ")}
                >
                  {g.pass_count} passed · {g.supported_count} supported · {g.fail_count} failed of{" "}
                  {g.total_assertions} assertions
                </Alert>
              ))}
              {ledger.data?.entries.map((e) => {
                const treatment = e.treatment ? treatmentSummary(e.treatment) : null;
                return (
                  <Card key={e.id} withBorder>
                    <Stack gap="xs">
                      <Group>
                        <Text fw={600}>{e.source.label || e.source_kind}</Text>
                        <StatusBadge status={e.verification_status} />
                      </Group>
                      {e.source.url && /^https?:\/\//i.test(e.source.url) && (
                        <Anchor href={e.source.url} target="_blank" rel="noopener noreferrer">
                          View source
                        </Anchor>
                      )}
                      {e.source.subtitle && <Text>{e.source.subtitle}</Text>}
                      {e.source.passages?.map((p, i) => (
                        <Card key={i} bg="var(--mantine-color-default-hover)">
                          <Text>{p.text}</Text>
                          <Text size="xs">
                            Page {p.page ?? "—"} · offsets {p.offset_start}–{p.offset_end}
                          </Text>
                        </Card>
                      ))}
                      <Text size="xs">
                        {e.provider || "—"} · retrieved {e.retrieved_at || e.created_at} ·
                        confidence {e.confidence ?? "—"}
                      </Text>
                      {treatment && (
                        <>
                          <Text fw={600}>{treatment.label}</Text>
                          <Text size="xs">
                            As of {treatment.asOf}. Citation graph activity does not establish legal
                            validity.
                          </Text>
                          {treatment.preview.map((c, i) => (
                            <Text key={i} size="sm">
                              {formatCitingRef(c)}
                            </Text>
                          ))}
                          {treatment.moreCount > 0 && (
                            <Text size="xs">
                              {treatment.moreCount} further opinions in the ledger.
                            </Text>
                          )}
                        </>
                      )}
                    </Stack>
                  </Card>
                );
              })}
              {ledger.data?.entries.length === 0 && (
                <Text c="dimmed">No citation ledger entries.</Text>
              )}
            </Stack>
          </ResourcePanel>
        </Tabs.Panel>
        <Tabs.Panel value="receipts" pt="md">
          <Stack>
            <MultiSelect
              label="Event kinds"
              placeholder="All events"
              data={kinds}
              value={filter}
              onChange={setFilter}
            />
            <Button
              loading={action.busy}
              onClick={() =>
                void action.run(async () => {
                  const result = await exportChatReceiptsJsonl(
                    message.chat_id,
                    filter as ReceiptEventKind[],
                  );
                  download(
                    new Blob([result.jsonl], { type: "application/x-ndjson" }),
                    result.filename,
                  );
                })
              }
            >
              Export JSONL
            </Button>
            <ActionFeedback {...action} />
            <ResourcePanel {...receipts}>
              {receipts.data?.map((r, i) => (
                <Card key={i} withBorder mb="sm">
                  <Group>
                    <Badge>{r.kind}</Badge>
                    <Text size="xs">{new Date(r.ts).toLocaleString()}</Text>
                  </Group>
                  {Object.entries(r.detail).map(([k, v]) => (
                    <Text key={k} size="sm">
                      <Text span fw={600}>
                        {k.replaceAll("_", " ")}:{" "}
                      </Text>
                      {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </Text>
                  ))}
                </Card>
              ))}
              {receipts.data?.length === 0 && <Text c="dimmed">No matching receipt events.</Text>}
            </ResourcePanel>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
