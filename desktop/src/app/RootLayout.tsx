
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar/Sidebar';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        style={{ position: "relative", width: "100%", minHeight: "100vh" }}
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

      {/* {footer && <Footer1 />} */}
      {/* <footer className={styles.footer}>
        © {new Date().getFullYear()} Your Brand
      </footer> */}
    </div>
  );
};