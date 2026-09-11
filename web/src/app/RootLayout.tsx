
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar/Sidebar';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RequireAuth } from './RequireAuth';
import OfflineStatus from '../components/pwa/OfflineStatus';
import InstallPrompt from '../components/pwa/InstallPrompt';
import ChatWidget from '../components/chat/ChatWidget';
import SignOutButton from '../components/pwa/SignOutButton';

export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarRoutes = ["/", "/project_details", "/location", "/amenities", "/vr"];
  
  const isSidebarVisible = sidebarRoutes.some(route => 
    route === "/" ? location.pathname === "/" : location.pathname.startsWith(route)
  );

  const isAboutUs = location.pathname === "/aboutus";
  const isBlueprint = location.pathname === "/blueprint";

  return (
    <div
    // className={styles.appWrapper}
    >
     {isSidebarVisible && <Sidebar />}

      {/* Floating Back Button for About Us and Blueprint pages */}
      {(isAboutUs || isBlueprint) && (
        <button
          onClick={() => isAboutUs ? navigate('/project_details') : navigate('/')}
          className="fixed top-6 left-6 z-[1001] px-5 py-2.5 bg-black/30 hover:bg-black/50 border border-white/20 rounded-full text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-lg">←</span> Back
        </button>
      )}

      <main
        // min-h-viewport (index.css) carries the 100vh -> 100dvh fallback that
        // an inline style cannot express.
        className="min-h-viewport"
        style={{ position: "relative", width: "100%" }}
      >
        {/* Overlapping crossfade: the new page fades in ON TOP of the old one
            (both absolutely stacked), so the dark background never shows through
            between routes — no black flash, just a smooth reveal. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, zIndex: 2 }}
            animate={{ opacity: 1, zIndex: 2 }}
            exit={{ opacity: 1, zIndex: 1 }}
            transition={{ opacity: { duration: 0.4, ease: "easeInOut" } }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <ToastContainer />

      {/* Only the service-worker update bar now — the offline status pill was
          removed from the corner; see the component. */}
      <OfflineStatus />

      {/* The install offer, surfaced on its own rather than buried in the
          OfflineStatus panel — that panel is behind a collapsed pill nobody
          opens, which made the app look like it could not be installed. */}
      <InstallPrompt />

      {/* The spoken project guide. Inside the authenticated shell like the two
          above: it answers with project detail, and it costs money per question,
          so it is not offered to a logged-out visitor. */}
      <ChatWidget />

      {/* Staff-only, home screen only — the sign out that used to live in the
          offline panel. */}
      <SignOutButton />

      {/* {footer && <Footer1 />} */}
      {/* <footer className={styles.footer}>
        © {new Date().getFullYear()} Your Brand
      </footer> */}
    </div>
  );
};

/**
 * Every application route renders through this. Wrapping once here — rather
 * than per route — means a new route added to the router is guarded by default
 * instead of being accidentally public.
 */
export const ProtectedRootLayout = () => (
  <RequireAuth>
    <RootLayout />
  </RequireAuth>
);