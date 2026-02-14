import { WorkspaceGate } from "@/components/WorkspaceGate";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceGate>
      {children}
    </WorkspaceGate>
  );
}
