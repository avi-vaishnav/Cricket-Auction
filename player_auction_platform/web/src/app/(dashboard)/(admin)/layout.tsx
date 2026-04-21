"use client";
import { RoleGuard } from "@/components/RoleGuard";

export default function AdminRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      {children}
    </RoleGuard>
  );
}
