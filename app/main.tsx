import { App } from "@/App.tsx";
import { store } from "@/Atoms.ts";
import { syncSessionAcrossTabs } from "@/auth/authSession.ts";
import "@/global.css";
import { theme } from "@/theme.ts";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
syncSessionAcrossTabs();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>
    </Provider>
  </StrictMode>,
);
