"use client";

import { ProfileProvider } from "@/hooks/useProfile";
import { ScoresProvider } from "@/hooks/useScores";
import { EcrituresProvider } from "@/hooks/useEcritures";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProfileGate } from "@/components/ProfileGate";
import { AppHeader } from "@/components/AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
    <ProfileProvider>
      <ProfileGate>
        <ScoresProvider>
          <EcrituresProvider>
            <div className="min-h-screen">
              <AppHeader />
              <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            </div>
          </EcrituresProvider>
        </ScoresProvider>
      </ProfileGate>
    </ProfileProvider>
    </ThemeProvider>
  );
}
