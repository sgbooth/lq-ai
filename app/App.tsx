import { sessionAtom } from "@/auth/authAtoms.ts";
import { ChangePasswordPage } from "@/auth/ChangePasswordPage.tsx";
import { LoginPage } from "@/auth/LoginPage.tsx";
import { safeNext } from "@/auth/authRedirect.ts";
import { autonomousEnabledAtom, settingsStatusAtom } from "@/features/settings/settingsAtoms.ts";
import { AppShellPanel } from "@/features/shell/AppShellPanel.tsx";
import { WordAddinLoginPage } from "@/features/wordAddin/WordAddinLoginPage.tsx";
import { Alert, Anchor, Loader, Stack, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { lazy, Suspense } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
const AuditLogPage = lazy(() =>
  import("@/features/admin/AuditLogPage.tsx").then((m) => ({ default: m.AuditLogPage })),
);
const DeveloperPage = lazy(() =>
  import("@/features/admin/DeveloperPage.tsx").then((m) => ({ default: m.DeveloperPage })),
);
const IntakeBridgesPage = lazy(() =>
  import("@/features/admin/IntakeBridgesPage.tsx").then((m) => ({ default: m.IntakeBridgesPage })),
);
const ModelsPage = lazy(() =>
  import("@/features/admin/ModelsPage.tsx").then((m) => ({ default: m.ModelsPage })),
);
const ProviderKeysPage = lazy(() =>
  import("@/features/admin/ProviderKeysPage.tsx").then((m) => ({ default: m.ProviderKeysPage })),
);
const ResearchSourcesPage = lazy(() =>
  import("@/features/admin/ResearchSourcesPage.tsx").then((m) => ({
    default: m.ResearchSourcesPage,
  })),
);
const WordAddinPage = lazy(() =>
  import("@/features/admin/WordAddinPage.tsx").then((m) => ({ default: m.WordAddinPage })),
);
const AutonomousConfigurePage = lazy(() =>
  import("@/features/autonomous/AutonomousConfigurePage.tsx").then((m) => ({
    default: m.AutonomousConfigurePage,
  })),
);
const AutonomousMemoryPage = lazy(() =>
  import("@/features/autonomous/AutonomousMemoryPage.tsx").then((m) => ({
    default: m.AutonomousMemoryPage,
  })),
);
const AutonomousNotificationsPage = lazy(() =>
  import("@/features/autonomous/AutonomousNotificationsPage.tsx").then((m) => ({
    default: m.AutonomousNotificationsPage,
  })),
);
const AutonomousPage = lazy(() =>
  import("@/features/autonomous/AutonomousPage.tsx").then((m) => ({ default: m.AutonomousPage })),
);
const AutonomousPrecedentsPage = lazy(() =>
  import("@/features/autonomous/AutonomousPrecedentsPage.tsx").then((m) => ({
    default: m.AutonomousPrecedentsPage,
  })),
);
const AutonomousProposalsPage = lazy(() =>
  import("@/features/autonomous/AutonomousProposalsPage.tsx").then((m) => ({
    default: m.AutonomousProposalsPage,
  })),
);
const AutonomousSchedulesPage = lazy(() =>
  import("@/features/autonomous/AutonomousSchedulesPage.tsx").then((m) => ({
    default: m.AutonomousSchedulesPage,
  })),
);
const AutonomousSessionPage = lazy(() =>
  import("@/features/autonomous/AutonomousSessionPage.tsx").then((m) => ({
    default: m.AutonomousSessionPage,
  })),
);
const AutonomousWatchesPage = lazy(() =>
  import("@/features/autonomous/AutonomousWatchesPage.tsx").then((m) => ({
    default: m.AutonomousWatchesPage,
  })),
);
const OrchestrationChatPage = lazy(() =>
  import("@/features/autonomous/OrchestrationChatPage.tsx").then((m) => ({
    default: m.OrchestrationChatPage,
  })),
);
const ChatsPage = lazy(() =>
  import("@/features/chat/ChatsPage.tsx").then((m) => ({ default: m.ChatsPage })),
);
const HomePage = lazy(() =>
  import("@/features/home/HomePage.tsx").then((m) => ({ default: m.HomePage })),
);
const KnowledgeDetailPage = lazy(() =>
  import("@/features/knowledge/KnowledgeDetailPage.tsx").then((m) => ({
    default: m.KnowledgeDetailPage,
  })),
);
const KnowledgePage = lazy(() =>
  import("@/features/knowledge/KnowledgePage.tsx").then((m) => ({ default: m.KnowledgePage })),
);
const LearnPage = lazy(() =>
  import("@/features/learn/LearnPage.tsx").then((m) => ({ default: m.LearnPage })),
);
const MatterPage = lazy(() =>
  import("@/features/matters/MatterPage.tsx").then((m) => ({ default: m.MatterPage })),
);
const MattersPage = lazy(() =>
  import("@/features/matters/MattersPage.tsx").then((m) => ({ default: m.MattersPage })),
);
const EasyPlaybookPage = lazy(() =>
  import("@/features/playbooks/EasyPlaybookPage.tsx").then((m) => ({
    default: m.EasyPlaybookPage,
  })),
);
const PlaybookExecutionPage = lazy(() =>
  import("@/features/playbooks/PlaybookExecutionPage.tsx").then((m) => ({
    default: m.PlaybookExecutionPage,
  })),
);
const PlaybooksPage = lazy(() =>
  import("@/features/playbooks/PlaybooksPage.tsx").then((m) => ({ default: m.PlaybooksPage })),
);
const SavedPromptsPage = lazy(() =>
  import("@/features/prompts/SavedPromptsPage.tsx").then((m) => ({ default: m.SavedPromptsPage })),
);
const AccountPage = lazy(() =>
  import("@/features/settings/AccountPage.tsx").then((m) => ({ default: m.AccountPage })),
);
const AppearancePage = lazy(() =>
  import("@/features/settings/AppearancePage.tsx").then((m) => ({ default: m.AppearancePage })),
);
const AutonomousSettingsPage = lazy(() =>
  import("@/features/settings/AutonomousSettingsPage.tsx").then((m) => ({
    default: m.AutonomousSettingsPage,
  })),
);
const SkillEditorPage = lazy(() =>
  import("@/features/skills/SkillEditorPage.tsx").then((m) => ({ default: m.SkillEditorPage })),
);
const SkillPage = lazy(() =>
  import("@/features/skills/SkillPage.tsx").then((m) => ({ default: m.SkillPage })),
);
const SkillWorkspacesPage = lazy(() =>
  import("@/features/skills/SkillWorkspacesPage.tsx").then((m) => ({
    default: m.SkillWorkspacesPage,
  })),
);
const SkillsPage = lazy(() =>
  import("@/features/skills/SkillsPage.tsx").then((m) => ({ default: m.SkillsPage })),
);
const NewTabularPage = lazy(() =>
  import("@/features/tabular/NewTabularPage.tsx").then((m) => ({ default: m.NewTabularPage })),
);
const TabularDetailPage = lazy(() =>
  import("@/features/tabular/TabularDetailPage.tsx").then((m) => ({
    default: m.TabularDetailPage,
  })),
);
const TabularPage = lazy(() =>
  import("@/features/tabular/TabularPage.tsx").then((m) => ({ default: m.TabularPage })),
);
const TrustPage = lazy(() =>
  import("@/features/trust/TrustPage.tsx").then((m) => ({ default: m.TrustPage })),
);
/** Receipts and halt controls for existing work stay reachable after autonomous work is disabled. */
const AUTONOMOUS_RECEIPT = /^\/autonomous\/(sessions|orchestration\/chat)\/[^/]+\/?$/;
const pageLoader = (
  <Stack align="center" p="xl">
    <Loader aria-label="Loading page" />
  </Stack>
);
export const App = () => {
  const session = useAtomValue(sessionAtom);
  const enabled = useAtomValue(autonomousEnabledAtom);
  const settingsStatus = useAtomValue(settingsStatusAtom);
  const [path] = useLocation();
  if (path === "/word-addin/oauth-start" || path === "/lq-ai/word-addin/oauth-start")
    return <WordAddinLoginPage />;
  if (path === "/lq-ai" || path.startsWith("/lq-ai/"))
    return <Redirect to={(path.slice(6) || "/") + window.location.search} />;
  if (!session)
    return path === "/login" ? (
      <LoginPage />
    ) : (
      <Redirect to={"/login?next=" + encodeURIComponent(path + window.location.search)} />
    );
  if (session.user.must_change_password || path === "/change-password")
    return <ChangePasswordPage />;
  if (path === "/login") return <Redirect to={safeNext(window.location.search)} />;
  const admin = session.user.is_admin || session.user.role === "admin";
  const denied = path.startsWith("/admin/") && !admin;
  const autonomousMutation = path.startsWith("/autonomous/") && !AUTONOMOUS_RECEIPT.test(path);
  return (
    <AppShellPanel>
      <Suspense fallback={pageLoader}>
        {denied ? (
          <Alert color="red" m="xl" title="Administrator access required">
            Your account cannot access this page.
          </Alert>
        ) : autonomousMutation && settingsStatus === "loading" ? (
          pageLoader
        ) : autonomousMutation && settingsStatus === "error" ? (
          <Alert color="red" m="xl" title="Autonomous settings unavailable">
            Your autonomous work setting could not be loaded. Reload the page to try again.
          </Alert>
        ) : autonomousMutation && !enabled ? (
          <Alert m="xl" title="Autonomous work is disabled">
            <Stack>
              <Text>
                Enable autonomous work in settings to configure new work. Existing receipts remain
                available.
              </Text>
              <Anchor component={Link} href="/settings/autonomous">
                Autonomous settings
              </Anchor>
            </Stack>
          </Alert>
        ) : (
          <Switch>
            <Route path="/">
              <HomePage />
            </Route>
            <Route path="/chats">
              <ChatsPage />
            </Route>
            <Route path="/matters">
              <MattersPage />
            </Route>
            <Route path="/matters/:id">
              {(params) => <MatterPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/knowledge">
              <KnowledgePage />
            </Route>
            <Route path="/knowledge/:id">
              {(params) => <KnowledgeDetailPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/skills">
              <SkillsPage />
            </Route>
            <Route path="/skills/new">
              <SkillEditorPage />
            </Route>
            <Route path="/skills/workspaces">
              <SkillWorkspacesPage />
            </Route>
            <Route path="/skills/:id/edit">
              {(params) => <SkillEditorPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/skills/:id">
              {(params) => <SkillPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/playbooks">
              <PlaybooksPage />
            </Route>
            <Route path="/playbooks/easy">
              <EasyPlaybookPage />
            </Route>
            <Route path="/playbook-executions/:id">
              {(params) => <PlaybookExecutionPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/tabular">
              <TabularPage />
            </Route>
            <Route path="/tabular/new">
              <NewTabularPage />
            </Route>
            <Route path="/tabular/:id">
              {(params) => <TabularDetailPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/saved-prompts">
              <SavedPromptsPage />
            </Route>
            <Route path="/learn">
              <LearnPage />
            </Route>
            <Route path="/learn/:topic">
              {(params) => <LearnPage topic={"/" + params.topic} />}
            </Route>
            <Route path="/trust">
              <TrustPage />
            </Route>
            <Route path="/settings/account">
              <AccountPage />
            </Route>
            <Route path="/settings/appearance">
              <AppearancePage />
            </Route>
            <Route path="/settings/autonomous">
              <AutonomousSettingsPage />
            </Route>
            <Route path="/autonomous">
              <AutonomousPage />
            </Route>
            <Route path="/autonomous/configure">
              <AutonomousConfigurePage />
            </Route>
            <Route path="/autonomous/matters">
              <AutonomousConfigurePage mode="intake" />
            </Route>
            <Route path="/autonomous/memory">
              <AutonomousMemoryPage />
            </Route>
            <Route path="/autonomous/precedents">
              <AutonomousPrecedentsPage />
            </Route>
            <Route path="/autonomous/proposals">
              <AutonomousProposalsPage />
            </Route>
            <Route path="/autonomous/notifications">
              <AutonomousNotificationsPage />
            </Route>
            <Route path="/autonomous/schedules">
              <AutonomousSchedulesPage />
            </Route>
            <Route path="/autonomous/schedules/new">
              <AutonomousConfigurePage mode="schedule" />
            </Route>
            <Route path="/autonomous/watches">
              <AutonomousWatchesPage />
            </Route>
            <Route path="/autonomous/watches/new">
              <AutonomousConfigurePage mode="watch" />
            </Route>
            <Route path="/autonomous/sessions/:id">
              {(params) => <AutonomousSessionPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/autonomous/orchestration/chat">
              <OrchestrationChatPage />
            </Route>
            <Route path="/autonomous/orchestration/chat/:id">
              {(params) => <OrchestrationChatPage id={params.id} key={params.id} />}
            </Route>
            <Route path="/admin/provider-keys">
              <ProviderKeysPage />
            </Route>
            <Route path="/admin/research-sources">
              <ResearchSourcesPage />
            </Route>
            <Route path="/admin/models">
              <ModelsPage />
            </Route>
            <Route path="/admin/audit-log">
              <AuditLogPage />
            </Route>
            <Route path="/admin/developer">
              <DeveloperPage />
            </Route>
            <Route path="/admin/intake-bridges">
              <IntakeBridgesPage />
            </Route>
            <Route path="/admin/word-addin">
              <WordAddinPage />
            </Route>
            <Route>
              <Alert m="xl" title="Page not found">
                <Anchor component={Link} href="/">
                  Return home
                </Anchor>
              </Alert>
            </Route>
          </Switch>
        )}
      </Suspense>
    </AppShellPanel>
  );
};
