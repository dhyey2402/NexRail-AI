import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { Footer, Navbar } from '@/components/layout/Chrome'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className={cn("flex min-h-svh flex-col bg-bg text-ink", isLanding && "bg-[#050608]")}>
      {!isLanding && <Navbar />}
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      {!isLanding && <Footer />}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: 'bg-surface border-border text-ink',
        }}
      />
    </div>
  )
}
