import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '28px 32px 60px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
