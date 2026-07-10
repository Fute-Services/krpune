
import { Outlet, useLocation, useNavigation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const RootLayout = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoading = navigation.state === "loading";

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

      {/* Global loading bar for route transitions */}
      {isLoading && <div
      //   className={styles.progressBar} 
      />}

      <main
      //    className={styles.mainContent}
      >
        {/* Outlet is where the child routes (Home, Dashboard) render */}
        <Outlet />
      </main>
      <ToastContainer />

      {/* {footer && <Footer1 />} */}
      {/* <footer className={styles.footer}>
        © {new Date().getFullYear()} Your Brand
      </footer> */}
    </div>
  );
};