"use client";
import { RoleGuard } from "@/components/RoleGuard";

export default function AuctioneerRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auctioneer routes can be accessed by both normal Users and Admins
  return (
    <RoleGuard allowedRoles={["USER", "ADMIN"]}>
      {children}
    </RoleGuard>
  );
}
