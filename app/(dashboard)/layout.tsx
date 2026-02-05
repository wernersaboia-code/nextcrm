// app/(dashboard)/layout.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/sign-in")
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    user={{
                        name: user.user_metadata?.name,
                        email: user.email,
                    }}
                />
                <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}