import { useLocation } from 'react-router-dom'
import Dock from './Dock'

// Wraps every signed in page. The dashboard has its own quick links, so the
// dock only shows on the other pages.
export default function AppShell({ children }) {
  const { pathname } = useLocation()
  const showDock = pathname !== '/dashboard'
  return (
    <>
      <div className={showDock ? 'has-dock' : ''}>{children}</div>
      {showDock && <Dock />}
    </>
  )
}
