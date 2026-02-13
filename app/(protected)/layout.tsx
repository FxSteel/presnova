import { WorkspaceBootstrap } from "@/components/WorkspaceBootstrap";
import { WorkspaceProvider } from "@/lib/workspace-provider";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <WorkspaceBootstrap>
        {children}
      </WorkspaceBootstrap>
    </WorkspaceProvider>
  );
}
