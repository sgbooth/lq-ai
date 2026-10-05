import { PlaybookDisclaimerPanel } from "@/shared/PlaybookDisclaimerPanel.tsx";
import type { PlaybookCreate, PositionCreate } from "@/shared/types.ts";
import { Button, Card, Group, Select, Stack, TextInput, Textarea } from "@mantine/core";
import type React from "react";
import { useState } from "react";

const severityOptions = ["critical", "high", "medium", "low"];

interface Props {
  initial: PlaybookCreate;
  onSave: (draft: PlaybookCreate) => Promise<unknown>;
  busy?: boolean;
}
export const PlaybookEditorPanel: React.FC<Props> = ({ initial, onSave, busy }) => {
  const [draft, setDraft] = useState(initial);
  const positions = draft.positions || [];
  const setPosition = (i: number, patch: Partial<PositionCreate>) =>
    setDraft({ ...draft, positions: positions.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <Stack
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(draft);
      }}
    >
      <PlaybookDisclaimerPanel />
      <TextInput
        label="Name"
        required
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
      />
      <TextInput
        label="Contract type"
        required
        value={draft.contract_type}
        onChange={(e) => setDraft({ ...draft, contract_type: e.currentTarget.value })}
      />
      <TextInput
        label="Version"
        value={draft.version || "1.0.0"}
        onChange={(e) => setDraft({ ...draft, version: e.currentTarget.value })}
      />
      <Textarea
        label="Description"
        value={draft.description || ""}
        onChange={(e) => setDraft({ ...draft, description: e.currentTarget.value })}
      />
      {positions.map((p, i) => (
        <Card key={i} withBorder>
          <Stack>
            <Group justify="space-between">
              <TextInput
                label={`Position ${i + 1}: issue`}
                required
                value={p.issue}
                onChange={(e) => setPosition(i, { issue: e.currentTarget.value })}
              />
              <Button
                variant="subtle"
                color="red"
                onClick={() =>
                  setDraft({ ...draft, positions: positions.filter((_, j) => j !== i) })
                }
              >
                Remove
              </Button>
            </Group>
            <Textarea
              label="Description"
              value={p.description || ""}
              onChange={(e) => setPosition(i, { description: e.currentTarget.value })}
            />
            <Textarea
              label="Standard language"
              required
              autosize
              minRows={3}
              value={p.standard_language}
              onChange={(e) => setPosition(i, { standard_language: e.currentTarget.value })}
            />
            <Select
              label="Severity if missing"
              data={severityOptions}
              value={p.severity_if_missing}
              onChange={(v) => setPosition(i, { severity_if_missing: v as "high" })}
            />
            <TextInput
              label="Detection keywords (comma-separated)"
              value={p.detection_keywords?.join(", ") || ""}
              onChange={(e) =>
                setPosition(i, {
                  detection_keywords: e.currentTarget.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
            />
            <Textarea
              label="Detection examples (one per line)"
              value={p.detection_examples?.join("\n") || ""}
              onChange={(e) =>
                setPosition(i, {
                  detection_examples: e.currentTarget.value.split("\n").filter(Boolean),
                })
              }
            />
            <Textarea
              label="Redline strategy"
              value={p.redline_strategy || ""}
              onChange={(e) => setPosition(i, { redline_strategy: e.currentTarget.value })}
            />
            {p.fallback_tiers?.map((f, j) => (
              <Group key={j}>
                <TextInput
                  label="Fallback description"
                  value={f.description}
                  onChange={(e) =>
                    setPosition(i, {
                      fallback_tiers: p.fallback_tiers!.map((x, k) =>
                        k === j ? { ...x, description: e.currentTarget.value } : x,
                      ),
                    })
                  }
                />
                <Textarea
                  label="Fallback language"
                  value={f.language}
                  onChange={(e) =>
                    setPosition(i, {
                      fallback_tiers: p.fallback_tiers!.map((x, k) =>
                        k === j ? { ...x, language: e.currentTarget.value } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="subtle"
                  color="red"
                  onClick={() =>
                    setPosition(i, { fallback_tiers: p.fallback_tiers!.filter((_, k) => k !== j) })
                  }
                >
                  Remove fallback
                </Button>
              </Group>
            ))}
            <Button
              variant="light"
              onClick={() =>
                setPosition(i, {
                  fallback_tiers: [
                    ...(p.fallback_tiers || []),
                    { rank: (p.fallback_tiers?.length || 0) + 1, description: "", language: "" },
                  ],
                })
              }
            >
              Add fallback
            </Button>
          </Stack>
        </Card>
      ))}
      <Button
        variant="light"
        onClick={() =>
          setDraft({
            ...draft,
            positions: [
              ...positions,
              {
                issue: "",
                standard_language: "",
                severity_if_missing: "medium",
                position_order: positions.length,
              },
            ],
          })
        }
      >
        Add position
      </Button>
      <Button type="submit" loading={busy}>
        Save playbook
      </Button>
    </Stack>
  );
};
