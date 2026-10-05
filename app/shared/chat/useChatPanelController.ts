import { userAtom } from "@/auth/authAtoms.ts";
import { recalledChatModel, rememberChatModel } from "@/shared/chat/chatModelMemory.ts";
import { store } from "@/Atoms.ts";
import { useResource } from "@/hooks/useResource.ts";
import { MAX_CHAT_ATTACHED_FILES, selectFileIdsForSend } from "@/shared/chat/attachedFiles.ts";
import { createChatActions, updateChat } from "@/shared/chat/chatActions.ts";
import * as chatsApi from "@/shared/chat/chatApi.ts";
import {
  activeChatAtom,
  chatBusyAtom,
  chatErrorAtom,
  chatGateAtom,
  enhancementOriginalsAtom,
  messagesAtom,
} from "@/shared/chat/chatAtoms.ts";
import { resolveSkillInputs } from "@/shared/chat/skillInputs.ts";
import { parseOAuthReturn, stripOAuthReturn } from "@/shared/chat/toolGate.ts";
import { pollFileStatus, uploadFile } from "@/shared/filesApi.ts";
import { listModels } from "@/shared/modelsApi.ts";
import { autoEnhanceAtom } from "@/shared/preferencesAtoms.ts";
import { autocompleteSkills, getInputs, listSkills } from "@/shared/skillsApi.ts";
import type { FileMeta } from "@/shared/types.ts";
import { useDebouncedValue } from "@mantine/hooks";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
export interface ChatPanelOptions {
  projectId?: string;
  initialChatId?: string;
  initialSkills?: string[];
  inlineSkill?: string;
}
export function useChatPanelController({
  projectId,
  initialChatId,
  initialSkills,
  inlineSkill,
}: ChatPanelOptions) {
  const autoEnhance = useAtomValue(autoEnhanceAtom);
  const [enhanceTrigger, setEnhanceTrigger] = useState(0);
  const pendingSend = useRef(false);
  const pendingEnhancement = useRef<{ original: string; enhanced: string } | null>(null);
  const chat = useAtomValue(activeChatAtom),
    messages = useAtomValue(messagesAtom),
    busy = useAtomValue(chatBusyAtom),
    error = useAtomValue(chatErrorAtom),
    gate = useAtomValue(chatGateAtom);
  const [text, setText] = useState(() => {
    const v = sessionStorage.getItem("lq-ai:composer-prefill") || "";
    sessionStorage.removeItem("lq-ai:composer-prefill");
    return v;
  });
  const user = useAtomValue(userAtom);
  const [selection, setSelection] = useState<{ scope: string; value: string | null } | null>(null);
  const [skills, setSkills] = useState<string[]>(initialSkills ?? []);
  const [inputValues, setInputValues] = useState<Record<string, Record<string, unknown>>>({});
  const definitions = useResource(
    async () => Promise.all(skills.map(async (slug) => ({ slug, ...(await getInputs(slug)) }))),
    [skills.join(",")],
  );
  const slash = text.match(/^\/([^\s]*)$/);
  const suggestions = useResource(
    () => (slash ? autocompleteSkills(slash[1]) : Promise.resolve(null)),
    [slash?.[1]],
  );
  const [sticky, setSticky] = useState(false);
  const uploadScope = useRef(new AbortController());
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 250);
  const searchResults = useResource(
    () =>
      debouncedSearch.trim() ? chatsApi.search(debouncedSearch.trim(), 50) : Promise.resolve(null),
    [debouncedSearch],
  );
  const [archived, setArchived] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [oauth, setOauth] = useState(() => parseOAuthReturn(new URLSearchParams(location.search)));
  const [, navigate] = useLocation();
  const end = useRef<HTMLDivElement>(null);
  const list = useResource(
    () => chatsApi.listAllChats({ project_id: projectId, archived }),
    [projectId, archived],
  );
  const choices = useResource(async () => ({
    models: await listModels(),
    skills: await listSkills(),
  }));
  const [actions] = useState(createChatActions);
  const update = updateChat;
  const modelScope = `${user?.id}:${chat?.id ?? "new"}`;
  const catalog = choices.data?.models;
  const model = catalog
    ? selection?.scope === modelScope && catalog.data.some((m) => m.id === selection.value)
      ? selection.value
      : recalledChatModel(user?.id ?? "", chat?.id, catalog)
    : null;
  function setModel(value: string | null) {
    setSelection({ scope: modelScope, value });
    if (user && chat && value) rememberChatModel(user.id, chat.id, value);
  }
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages]);
  useEffect(() => {
    uploadScope.current = new AbortController();
    return () => {
      actions.dispose();
      uploadScope.current.abort();
    };
  }, [actions]);
  async function select(id: string) {
    uploadScope.current.abort();
    uploadScope.current = new AbortController();
    setUploading(false);
    const result = await actions.select(id);
    if (result) {
      setFiles([]);
      setSkills(result.chat.sticky_skills || initialSkills || []);
      setSticky(!!result.chat.sticky_skills?.length);
      setCursor(result.cursor);
    }
  }
  useEffect(() => {
    const returning = oauth.status !== "none" ? oauth.chatId : null;
    if (oauth.status !== "none") navigate(stripOAuthReturn(location.href), { replace: true });
    if (returning || initialChatId) void select((returning || initialChatId)!);
    else actions.reset();
  }, [initialChatId, projectId, actions]);
  function send(content = text) {
    if (!content.trim() || busy) return;
    if (autoEnhance) {
      pendingSend.current = true;
      setEnhanceTrigger((n) => n + 1);
    } else void rawSend(content);
  }
  async function rawSend(content = text) {
    if (!content.trim() || busy || uploading || !model || definitions.loading || definitions.error)
      return;
    const enhanced = pendingEnhancement.current?.enhanced === content;
    const sentSkills = enhanced ? [...new Set([...skills, "enhance-prompt"])] : skills;
    if (enhanced)
      store.set(enhancementOriginalsAtom, {
        ...store.get(enhancementOriginalsAtom),
        [content]: pendingEnhancement.current!.original,
      });
    const resolved = Object.fromEntries(
      (definitions.data ?? []).map((def) => [
        def.slug,
        resolveSkillInputs(def, inputValues[def.slug] ?? {}),
      ]),
    );
    const missing = Object.entries(resolved).flatMap(([slug, result]) =>
      result.missing.map((name) => slug + ": " + name),
    );
    if (missing.length) {
      update({ error: "Required skill inputs: " + missing.join(", ") });
      return;
    }
    const skill_inputs = Object.fromEntries(
      Object.entries(resolved).map(([slug, result]) => [slug, result.values]),
    );
    await actions.send(
      {
        content,
        model: model || undefined,
        skills: sentSkills,
        attached_skills: [
          ...skills.map((slug) => ({ slug, source: "picker", inputs: skill_inputs[slug] })),
          ...(inlineSkill ? [{ inline_body: inlineSkill, source: "wizard" }] : []),
        ],
        skill_inputs,
        set_sticky: sticky,
        file_ids: selectFileIdsForSend(files),
      },
      projectId,
      () => {
        setText("");
        const active = store.get(activeChatAtom);
        if (user && active && model) rememberChatModel(user.id, active.id, model);
      },
    );
    list.reload();
  }
  async function uploadFiles(incoming: File[]) {
    const signal = uploadScope.current.signal;
    setUploading(true);
    try {
      for (const file of incoming.slice(0, MAX_CHAT_ATTACHED_FILES - files.length)) {
        try {
          const uploaded = await uploadFile(file, { project_id: projectId, signal });
          const result = await pollFileStatus(uploaded.id, { signal });
          if (signal.aborted) return;
          if (result.file?.ingestion_status !== "ready")
            throw new Error("Document ingestion failed.");
          setFiles((previous) => [...previous, result.file!].slice(0, MAX_CHAT_ATTACHED_FILES));
        } catch (e) {
          if (!signal.aborted) update({ error: e instanceof Error ? e.message : "Upload failed." });
        }
      }
    } finally {
      if (!signal.aborted) setUploading(false);
    }
  }
  const resume = actions.resume;
  const skillDefinitions = definitions.data?.map((def) => ({
    ...def,
    inputs: [...def.required.map((input) => ({ ...input, required: true })), ...def.optional],
  }));
  const sendDisabled =
    !text.trim() ||
    uploading ||
    Boolean(definitions.error) ||
    !model ||
    definitions.loading ||
    definitions.data?.some((def) =>
      [...def.required.map((input) => ({ ...input, required: true })), ...def.optional].some(
        (input) =>
          input.required &&
          [undefined, null, ""].includes(
            (inputValues[def.slug]?.[input.name] ?? input.default) as undefined,
          ),
      ),
    );
  return {
    uploadFiles,
    sendDisabled,
    projectId,
    initialSkills,
    enhanceTrigger,
    pendingSend,
    pendingEnhancement,
    chat,
    messages,
    busy,
    error,
    gate,
    text,
    setText,
    model,
    setModel,
    skills,
    setSkills,
    inputValues,
    setInputValues,
    definitions,
    slash,
    suggestions,
    sticky,
    setSticky,
    uploadScope,
    uploading,
    setUploading,
    files,
    setFiles,
    search,
    setSearch,
    searchResults,
    archived,
    setArchived,
    cursor,
    setCursor,
    oauth,
    setOauth,
    navigate,
    end,
    list,
    choices,
    actions,
    update,
    select,
    send,
    rawSend,
    resume,
    skillDefinitions,
  };
}
