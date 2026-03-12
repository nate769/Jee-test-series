// app/layout.tsx — add AuthProvider wrapper
import type { Metadata } from "next"
import { AuthProvider } from "@/context/AuthContext"

export const metadata: Metadata = {
  title: "JEE Mock Test Platform",
  description: "Practice JEE Mains with full-length mock tests",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}