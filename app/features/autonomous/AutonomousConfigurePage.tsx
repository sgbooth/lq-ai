import * as api from "@/features/autonomous/autonomousApi.ts";
import { nextRun } from "@/features/autonomous/cron.ts";
import { listKnowledgeBases } from "@/features/knowledge/knowledgeApi.ts";
import { listProjects } from "@/features/matters/mattersApi.ts";
import { listPlaybooks } from "@/features/playbooks/playbooksApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { listSkills } from "@/shared/skillsApi.ts";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
interface Props {
  mode?: "run" | "intake" | "schedule" | "watch";
}
export const AutonomousConfigurePage: React.FC<Props> = ({ mode = "run" }) => {
  const [, navigate] = useLocation();
  const [project, setProject] = useState<string | null>(null);
  const [kb, setKb] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [playbook, setPlaybook] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cron, setCron] = useState("0 9 * * 1");
  const [cap, setCap] = useState<string | number>("1.00");
  const [query, setQuery] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setConfirmed(false), [project, kb, skill, playbook, cron, cap, query, enabled]);
  const r = useResource(
    async () => ({
      projects: await listProjects(),
      kbs: await listKnowledgeBases(),
      skills: await listSkills(),
      playbooks: await listPlaybooks(),
    }),
    [],
  );
  const a = useAction();
  const submit = () =>
    a.run(async () => {
      const params = {
        project_id: project ?? undefined,
        skill_ref: skill ?? undefined,
        playbook_id: playbook ?? undefined,
        target_kb_id: kb ?? undefined,
        max_cost_usd: String(cap),
      };
      if (mode === "schedule") {
        await api.createSchedule({ ...params, name: name || undefined, cron_expr: cron, enabled });
        navigate("/autonomous/schedules");
      } else if (mode === "watch") {
        await api.createWatch({ ...params, knowledge_base_id: kb!, enabled });
        navigate("/autonomous/watches");
      } else {
        const s = await api.runNow({
          ...params,
          query: mode === "intake" ? query.trim() : undefined,
        });
        navigate("/autonomous/sessions/" + s.id);
      }
    });
  const valid =
    Number(cap) > 0 &&
    (mode === "intake" ? !!project && !!query.trim() : !!skill || !!playbook) &&
    (mode !== "watch" || !!kb) &&
    (mode !== "schedule" || cron.trim().split(/\s+/).length === 5);
  const preview = mode === "schedule" ? nextRun(cron, new Date()) : null;
  return (
    <FeaturePanel
      title={
        mode === "intake"
          ? "Matter intake"
          : mode === "schedule"
            ? "New schedule"
            : mode === "watch"
              ? "New watch"
              : "Run autonomous work"
      }
      description="Review the target, task and spending cap before authorizing work."
    >
      <ResourcePanel {...r}>
        <Stack maw={700}>
          <Select
            label="Matter"
            clearable
            searchable
            data={r.data?.projects.map((p) => ({ value: p.id, label: p.name })) ?? []}
            value={project}
            onChange={setProject}
          />
          {mode === "intake" && (
            <Textarea
              label="Matter description / goal"
              required
              autosize
              minRows={5}
              maxLength={10000}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          )}
          <Select
            label="Skill"
            clearable
            searchable
            disabled={!!playbook}
            data={r.data?.skills.map((s) => ({ value: s.name, label: s.name })) ?? []}
            value={skill}
            onChange={setSkill}
          />
          <Select
            label="Playbook"
            clearable
            searchable
            disabled={!!skill}
            data={r.data?.playbooks.map((p) => ({ value: p.id, label: p.name })) ?? []}
            value={playbook}
            onChange={setPlaybook}
          />
          <Select
            label={mode === "watch" ? "Watched knowledge base" : "Target knowledge base"}
            required={mode === "watch"}
            clearable
            searchable
            data={r.data?.kbs.map((k) => ({ value: k.id, label: k.name })) ?? []}
            value={kb}
            onChange={setKb}
          />
          {mode === "schedule" && (
            <>
              <TextInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              <TextInput
                label="Cron expression (UTC)"
                description="Five fields: minute hour day month weekday. Example: 0 9 * * 1 = Mondays at 09:00 UTC."
                value={cron}
                onChange={(e) => setCron(e.currentTarget.value)}
              />
              <Text size="sm" c="dimmed">
                {preview
                  ? "Advisory next run: " + preview.toISOString()
                  : "Next-run preview unavailable for this expression. The server validates it on save."}
              </Text>
            </>
          )}
          <NumberInput
            label="Maximum cost per run (USD)"
            decimalScale={2}
            min={0.01}
            value={cap}
            onChange={setCap}
          />
          {(mode === "schedule" || mode === "watch") && (
            <Checkbox
              label="Enable automatically"
              checked={enabled}
              onChange={(e) => setEnabled(e.currentTarget.checked)}
            />
          )}
          <Alert color="orange">
            AI-generated work requires review.{" "}
            {mode === "watch"
              ? "New documents can trigger spending automatically."
              : mode === "schedule"
                ? "Each scheduled execution can spend up to this cap."
                : "This action starts a billable run."}
          </Alert>
          <Checkbox
            label="I have reviewed the target and authorize this work and its spending cap."
            checked={confirmed}
            onChange={(e) => setConfirmed(e.currentTarget.checked)}
          />
          <ActionFeedback {...a} />
          <Group>
            <Button loading={a.busy} disabled={!valid || !confirmed} onClick={() => void submit()}>
              {mode === "watch" || mode === "schedule" ? "Create" : "Start run"}
            </Button>
            <Button variant="default" component={Link} href="/autonomous">
              Cancel
            </Button>
          </Group>
        </Stack>
      </ResourcePanel>
    </FeaturePanel>
  );
};
