// router.tsx
import {
  createBrowserRouter,
  //  Navigate
} from 'react-router-dom';
import { RootLayout } from '../Layout/RouteLayout';
import Home from '../pages/Home/index';
// import LocationPage from '../pages/Location/index';
import LocationMap from '../pages/Location/index';
// import VRPage from '../pages/VR/index';
import VRPage from '../pages/VR/VRPage';
import Amenities from '../pages/Amenities/index';
import ProjectDetailsPage from '../pages/ProjectDetails/index';
import UnitPlanPage from '../pages/ProjectDetails/UnitPlanPage';
import MobilityPage from '../components/ProjectDetails/MobilityPage';
import VerticalTransportPage from '../components/ProjectDetails/VerticalTransportPage';
import BlueprintPage from "../pages/BluePrintpage/BluePrintPage";
import AboutUsPage from '../pages/AboutUs';
import Walkthrough from '../components/Overview/Walkthrough';
import GalleryPage from '../components/Overview/GalleryPage';
import Overview from '../components/Overview/Overview';
import Sustainability from '../components/Overview/Sustainability';
import ConceptSummary from '../components/Overview/ConceptSummary';
import { Import } from 'lucide-react';
import TerraceLevel from '../components/Amenities/TerraceLevel';
import PodiumLevel from '../components/Amenities/PodiumLevel';
import GroundLevel from '../components/Amenities/GroundLevel';
import LobbyReception from '../components/Amenities/LobbyReception';
import ProjectInfo from '../components/Overview/ProjectInfo';
import Construction from '../components/Overview/Construction'
import Fitout from '../components/ProjectDetails/Fitout';
import CirculationPlan from '../components/ProjectDetails/CirculationPlan'; 
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";


// import { Home } from '../pages/Home';
// import { Suspense, 
// lazy
//  } from 'react';

// Lazy load heavy components for performance
// const Dashboard = lazy(() => import('./pages/Dashboard'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: <Home />,
      },
      //   {
      //     path: 'dashboard',
      //     element: (
      //       <Suspense fallback={<div>Loading Dashboard...</div>}>
      //         <Dashboard />
      //       </Suspense>
      //     ),
      //     // Advanced: Loader fetches data before the component even mounts
      //     loader: async () => {
      //       const res = await fetch('/api/user/stats');
      //       if (res.status === 401) throw new Error("Unauthorized");
      //       return res.json();
      //     },
      //   },
      //   {
      //     path: 'profile',
      //     // Example of a Protected Route redirect
      //     element: <ProtectedRoute element={<Profile />} />,
      //   },
    ],


  },

  // {
  //   path: '/location',
  //   element: <RootLayout/>,
  //   // errorElement: <ErrorPage />, // Catches bubbles-up errors
  //   children: [
  //     {
  //       index: true,
  //       element: < LocationPage/>,
  //     },
  //   ]
  // },

  {
    path: '/location',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: <LocationMap />,
      },
    ]
  },

  {
    path: '/vr',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: < VRPage />,
      },
    ]
  },
  {
    path: '/construction',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: < Construction />,
      },
    ]
  },
  {
    path: '/blueprint',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: <BlueprintPage />,
      },
    ]
  },



  {
    path: '/amenities',
    element: <RootLayout />,
    // errorElement: <ErrorPage />, // Catches bubbles-up errors
    children: [
      {
        index: true,
        element: < Amenities />,
      },
    ]
  },


  {
    path: '/project_details',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <ProjectDetailsPage />,
      },
    ]
  },

  {
    path: '/mobility',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <MobilityPage />,
      },
    ]
  },

  {
    path: '/vertical-transport',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <VerticalTransportPage />,
      },
    ]
  },

  {
    path: '/aboutus',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <AboutUsPage />,
      },
    ]
  },

  {
    path: '/walkthrough',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Walkthrough />,
      },
    ]
  },
  {
    path: '/gallery',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <GalleryPage />,
      },
    ]
  },
  {
    path: '/overview',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Overview />,
      },
    ]
  },
  {
    path: '/sustainability',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Sustainability />,
      },
    ]
  },
  {
    path: '/concept_summary',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <ConceptSummary />,
      },
    ]
  },

  //  {
  //   path: '/unitplan/:id',
  //   element: <RootLayout/>,
  //   // errorElement: <ErrorPage />, // Catches bubbles-up errors
  //   children: [
  //     {
  //       index: true,
  //       element: <UnitPlanPage/>,
  //     },
  //   ]
  // },

  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'unitplan/:id',
        element: <UnitPlanPage />,
      },
    ]
  },
   {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'projectinfo',
        element: <ProjectInfo />,
      },
    ]
  },
   {
    path: '/terrace-level',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <TerraceLevel />,
      },
    ]
  },
  {
    path: '/podium-level',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <PodiumLevel />,
      },
    ]
  },
  {
    path: '/ground-level',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <GroundLevel />,
      },
    ]
  },
  {
    path: '/lobby-reception',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LobbyReception />,
      },
    ]
  },
  {
    path: '/fitout-plan',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Fitout />,
      },
    ]
  },
  {
    path: '/circulation-plan',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <CirculationPlan />,
      },
    ]
  },
]);







