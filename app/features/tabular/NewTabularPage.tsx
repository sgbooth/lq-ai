import { listKnowledgeBaseFiles, listKnowledgeBases } from "@/features/knowledge/knowledgeApi.ts";
import * as api from "@/features/tabular/tabularApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { listSkills } from "@/shared/skillsApi.ts";
import type { TabularColumnSpec, TabularPreviewCostResponse } from "@/shared/types.ts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  MultiSelect,
  Select,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { useLocation } from "wouter";

const tierOptions = ["1", "2", "3", "4", "5"];

export const NewTabularPage = () => {
  const kbs = useResource(() => listKnowledgeBases());
  const skills = useResource(() => listSkills());
  const [kb, setKb] = useState<string | null>(null);
  const files = useResource(() => (kb ? listKnowledgeBaseFiles(kb) : Promise.resolve([])), [kb]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [skill, setSkill] = useState<string | null>(null);
  const [columns, setColumns] = useState<TabularColumnSpec[]>([{ name: "", query: "" }]);
  const [preview, setPreview] = useState<TabularPreviewCostResponse | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [, navigate] = useLocation();
  const action = useAction();
  const body = { document_ids: documents, skill_name: skill, columns: skill ? null : columns };
  const invalidate = () => {
    setPreview(null);
    setConfirmed(false);
  };
  return (
    <FeaturePanel title="New tabular review">
      <Stack maw={850}>
        <Select
          label="Knowledge base"
          value={kb}
          onChange={(v) => {
            setKb(v);
            setDocuments([]);
            invalidate();
          }}
          data={kbs.data?.map((k) => ({ value: k.id, label: k.name })) || []}
        />
        <ResourcePanel {...files}>
          <MultiSelect
            label="Documents"
            description="Select up to 100 processed documents."
            searchable
            maxValues={100}
            value={documents}
            onChange={(v) => {
              setDocuments(v);
              invalidate();
            }}
            data={
              files.data
                ?.filter((f) => f.document_id && f.ingestion_status === "ready")
                .map((f) => ({ value: f.document_id!, label: f.filename })) || []
            }
          />
        </ResourcePanel>
        <Select
          label="Table skill (optional)"
          clearable
          searchable
          value={skill}
          onChange={(v) => {
            setSkill(v);
            invalidate();
          }}
          data={
            skills.data
              ?.filter((s) => s.output_format === "table")
              .map((s) => ({ value: s.name, label: s.title || s.name })) || []
          }
        />
        {!skill && (
          <>
            {columns.map((column, i) => (
              <Card withBorder key={i}>
                <Stack>
                  <TextInput
                    label="Column name"
                    required
                    value={column.name}
                    onChange={(e) => {
                      setColumns(
                        columns.map((c, j) =>
                          j === i ? { ...c, name: e.currentTarget.value } : c,
                        ),
                      );
                      invalidate();
                    }}
                  />
                  <Textarea
                    label="Extraction question"
                    required
                    value={column.query}
                    onChange={(e) => {
                      setColumns(
                        columns.map((c, j) =>
                          j === i ? { ...c, query: e.currentTarget.value } : c,
                        ),
                      );
                      invalidate();
                    }}
                  />
                  <Checkbox
                    label="Ensemble verification"
                    checked={!!column.ensemble_verification}
                    onChange={(e) => {
                      setColumns(
                        columns.map((c, j) =>
                          j === i ? { ...c, ensemble_verification: e.currentTarget.checked } : c,
                        ),
                      );
                      invalidate();
                    }}
                  />
                  <Select
                    label="Minimum tier"
                    clearable
                    data={tierOptions}
                    value={
                      column.minimum_inference_tier ? String(column.minimum_inference_tier) : null
                    }
                    onChange={(v) => {
                      setColumns(
                        columns.map((c, j) =>
                          j === i ? { ...c, minimum_inference_tier: v ? Number(v) : null } : c,
                        ),
                      );
                      invalidate();
                    }}
                  />
                  <Button
                    color="red"
                    variant="subtle"
                    disabled={columns.length === 1}
                    onClick={() => {
                      setColumns(columns.filter((_, j) => j !== i));
                      invalidate();
                    }}
                  >
                    Remove column
                  </Button>
                </Stack>
              </Card>
            ))}
            <Button
              variant="light"
              onClick={() => {
                setColumns([...columns, { name: "", query: "" }]);
                invalidate();
              }}
            >
              Add column
            </Button>
          </>
        )}
        <ActionFeedback {...action} />
        <Button
          loading={action.busy}
          disabled={
            !documents.length || (!skill && columns.some((c) => !c.name.trim() || !c.query.trim()))
          }
          onClick={() =>
            void action.run(async () => {
              setPreview(await api.previewTabularCost(body));
              setConfirmed(false);
            })
          }
        >
          Preview cost
        </Button>
        {preview && (
          <>
            <Alert title="Cost preview">
              {preview.cells_count} cells · {preview.estimated_tokens} estimated tokens · $
              {preview.estimated_cost_usd}
            </Alert>
            {Number(preview.estimated_cost_usd) > 1 && (
              <Checkbox
                label="I confirm the estimated cost"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.currentTarget.checked)}
              />
            )}
            <Button
              loading={action.busy}
              disabled={Number(preview.estimated_cost_usd) > 1 && !confirmed}
              onClick={() =>
                void action.run(async () => {
                  const row = await api.executeTabular({
                    ...body,
                    confirmed_cost_usd: preview.estimated_cost_usd,
                  });
                  navigate(`/tabular/${row.id}`);
                })
              }
            >
              Confirm & run
            </Button>
          </>
        )}
      </Stack>
    </FeaturePanel>
  );
};
