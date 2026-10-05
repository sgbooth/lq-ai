import { createUserSkill, getUserSkill, updateUserSkill } from "@/features/skills/userSkillsApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { getSkill, parseSkillFrontmatter } from "@/shared/skillsApi.ts";
import { SkillTryPanel } from "@/shared/SkillTryPanel.tsx";
import { listMyTeams } from "@/shared/teamsApi.ts";
import { Alert, Button, Select, Stack, Tabs, TextInput, Textarea } from "@mantine/core";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";

const scopeOptions = ["user", "team"];

interface Props {
  id?: string;
}
export const SkillEditorPage: React.FC<Props> = ({ id }) => {
  const query = new URLSearchParams(useSearch());
  const fork = query.get("fork");
  const capture = query.get("capture");
  const [draftKey] = useState(() => query.get("draft") || capture || fork || crypto.randomUUID());
  const [slugEdited, setSlugEdited] = useState(false);
  const [frontmatter, setFrontmatter] = useState("{}");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [alias, setAlias] = useState("");
  const [scope, setScope] = useState<string | null>(query.get("scope") || "user");
  const [team, setTeam] = useState<string | null>(query.get("team"));
  const [, navigate] = useLocation();
  const action = useAction();
  const teams = useResource(() => listMyTeams("admin"));
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<string | null>("edit");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!id && !query.get("draft")) {
      const params = new URLSearchParams(query);
      params.set("draft", draftKey);
      navigate("/skills/new?" + params, { replace: true });
    }
  }, [id, draftKey]);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        if (id) {
          const row = await getUserSkill(id);
          if (!alive) return;
          setSlug(row.slug);
          setName(row.display_name);
          setDescription(row.description);
          setBody(row.body);
          setTags(row.tags.join(", "));
          setVersion(row.version);
          setScope(row.scope);
          setTeam(row.owner_team_id);
          setFrontmatter(JSON.stringify(row.frontmatter_extra, null, 2));
          setSlugEdited(true);
        } else {
          const raw =
            localStorage.getItem(`lq-ai:skill-draft:${draftKey}`) ||
            (capture ? sessionStorage.getItem(`lq-ai:capture-stash:${capture}`) : null);
          if (raw) {
            const d = JSON.parse(raw);
            setSlug(d.slug || "");
            setName(d.display_name || "");
            setDescription(d.description || "");
            setBody(d.body || "");
            setVersion(d.version || "1.0.0");
            setTags(d.tags || "");
            setAlias(d.alias || "");
            setScope(d.scope || "user");
            setTeam(d.team || null);
            setFrontmatter(d.frontmatter || "{}");
            setSlugEdited(!!d.slug);
          } else if (fork) {
            const row = await getSkill(fork);
            if (!alive) return;
            setSlug(row.name.slice(0, 75) + "-fork");
            setName(row.title + " (fork)");
            setDescription(row.description || "");
            setBody(row.content_md);
            setFrontmatter(JSON.stringify(parseSkillFrontmatter(row.content_yaml), null, 2));
            setSlugEdited(true);
          }
        }
        setReady(true);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Unable to load skill.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, fork, capture, draftKey]);
  useEffect(() => {
    if (ready && !id)
      try {
        localStorage.setItem(
          `lq-ai:skill-draft:${draftKey}`,
          JSON.stringify({
            slug,
            display_name: name,
            description,
            body,
            version,
            tags,
            alias,
            scope,
            team,
            frontmatter,
          }),
        );
      } catch {}
  }, [
    ready,
    id,
    draftKey,
    slug,
    name,
    description,
    body,
    version,
    tags,
    alias,
    scope,
    team,
    frontmatter,
  ]);
  return (
    <FeaturePanel
      title={id ? "Edit skill" : "Create skill"}
      description="Drafts are saved locally while you work."
    >
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="edit">Edit</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
          <Tabs.Tab value="try">Try draft</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="edit" pt="lg">
          <Stack
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(async () => {
                const frontmatter_extra: Record<string, unknown> = JSON.parse(frontmatter);
                if (
                  !frontmatter_extra ||
                  Array.isArray(frontmatter_extra) ||
                  typeof frontmatter_extra !== "object"
                )
                  throw new Error("Frontmatter must be a JSON object.");
                if (id) {
                  await updateUserSkill(id, {
                    frontmatter_extra,
                    display_name: name,
                    description,
                    version,
                    body,
                    tags: tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  });
                  navigate(`/skills/${encodeURIComponent(slug)}`);
                } else {
                  const created = await createUserSkill({
                    slug,
                    frontmatter_extra,
                    display_name: name,
                    description,
                    body,
                    version,
                    tags: tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                    scope: scope as "user" | "team",
                    owner_team_id: scope === "team" ? team : null,
                    slash_alias: alias || null,
                    forked_from: fork,
                    source_message_id: capture?.startsWith("prompt-") ? null : capture,
                  });
                  localStorage.removeItem(`lq-ai:skill-draft:${draftKey}`);
                  navigate(`/skills/${created.id}/edit`);
                }
              });
            }}
          >
            {loadError && <Alert color="red">{loadError}</Alert>}
            <TextInput
              label="Name"
              required
              value={name}
              onChange={(e) => {
                setName(e.currentTarget.value);
                if (!id && !slugEdited)
                  setSlug(
                    e.currentTarget.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                      .slice(0, 80),
                  );
              }}
            />
            <TextInput
              label="Slug"
              required
              disabled={!!id}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.currentTarget.value);
              }}
            />
            <Textarea
              label="Description"
              required
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
            <TextInput
              label="Version"
              required
              value={version}
              onChange={(e) => setVersion(e.currentTarget.value)}
            />
            <TextInput
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.currentTarget.value)}
            />
            {!id && (
              <>
                <TextInput
                  label="Slash alias"
                  pattern="/[a-z0-9-]{1,32}"
                  placeholder="/my-skill"
                  value={alias}
                  onChange={(e) => setAlias(e.currentTarget.value)}
                />
                <Select label="Scope" value={scope} onChange={setScope} data={scopeOptions} />
                {scope === "team" && (
                  <Select
                    label="Team"
                    required
                    value={team}
                    onChange={setTeam}
                    data={teams.data?.map((t) => ({ value: t.id, label: t.name })) || []}
                  />
                )}
              </>
            )}
            <Textarea
              label="Skill instructions (Markdown)"
              required
              autosize
              minRows={12}
              value={body}
              onChange={(e) => setBody(e.currentTarget.value)}
            />
            <Textarea
              label="Additional frontmatter (JSON)"
              description="Inputs, inference tier, tools, jurisdiction and other skill metadata."
              autosize
              minRows={6}
              value={frontmatter}
              onChange={(e) => setFrontmatter(e.currentTarget.value)}
            />
            <ActionFeedback {...action} />
            <Button
              type="submit"
              loading={action.busy}
              disabled={!ready || (scope === "team" && !team)}
            >
              Save skill
            </Button>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="preview" pt="lg">
          <MarkdownPanel content={body} />
        </Tabs.Panel>
        <Tabs.Panel value="try" pt="lg">
          {tab === "try" && body.trim() && <SkillTryPanel inlineBody={body} />}
        </Tabs.Panel>
      </Tabs>
    </FeaturePanel>
  );
};
