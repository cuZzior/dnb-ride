import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Panel | DNB On Bike",
    description: "Manage events and video suggestions for DNB On Bike",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
