import './globals.css'
export const metadata = {
  title: 'Roomly AI — AI Interior Design',
  description: 'Redesign your room with AI. Upload a photo and generate realistic interior design concepts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
