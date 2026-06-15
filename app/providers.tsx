"use client";

import { ProfileProvider } from "@/hooks/useProfile";
import { ScoresProvider } from "@/hooks/useScores";
import { EcrituresProvider } from "@/hooks/useEcritures";
import { VocabProvider } from "@/hooks/useVocab";
import { ListeningProvider } from "@/hooks/useListening";
import { SyncProvider } from "@/hooks/useSync";
import { SidebarProvider } from "@/hooks/useSidebar";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProfileGate } from "@/components/ProfileGate";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopBar } from "@/components/AppTopBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ProfileProvider>
          <ProfileGate>
            <SyncProvider>
              <ScoresProvider>
                <EcrituresProvider>
                  <VocabProvider>
                    <ListeningProvider>
                      <div className="flex min-h-screen">
                        <AppSidebar />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <AppTopBar />
                          <main className="flex-1 px-4 py-6 md:px-6">
                            <div className="mx-auto max-w-6xl">{children}</div>
                          </main>
                        </div>
                      </div>
                    </ListeningProvider>
                  </VocabProvider>
                </EcrituresProvider>
              </ScoresProvider>
            </SyncProvider>
          </ProfileGate>
        </ProfileProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
