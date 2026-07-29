// router.tsx
import {
  createHashRouter,
  //  Navigate
} from 'react-router-dom';
import { ProtectedRootLayout } from '@/app/RootLayout';
import LoginPage from '@/pages/Login/LoginPage';
import Home from '@/pages/Home/index';
// import LocationPage from '@/pages/Location/index';
import LocationMap from '@/pages/Location/index';
// import VRPage from '@/pages/VR/index';
import VRPage from '@/pages/VR/VRPage';
import Amenities from '@/pages/Amenities/index';
import ProjectDetailsPage from '@/pages/ProjectDetails/index';
import UnitPlanPage from '@/pages/ProjectDetails/UnitPlanPage';
import MobilityPage from '@/pages/ProjectDetails/MobilityPage';
import VerticalTransportPage from '@/pages/ProjectDetails/VerticalTransportPage';
import BlueprintPage from "@/pages/BluePrintpage/BluePrintPage";
import AboutUsPage from '@/pages/AboutUs';
import Walkthrough from '@/pages/Overview/Walkthrough';
import GalleryPage from '@/pages/Overview/GalleryPage';
import Overview from '@/pages/Overview/Overview';
import Sustainability from '@/pages/Overview/Sustainability';
import ConceptSummary from '@/pages/Overview/ConceptSummary';
import TerraceLevel from '@/pages/Amenities/TerraceLevel';
import PodiumLevel from '@/pages/Amenities/PodiumLevel';
import GroundLevel from '@/pages/Amenities/GroundLevel';
import LobbyReception from '@/pages/Amenities/LobbyReception';
import ProjectInfo from '@/pages/Overview/ProjectInfo';
import Construction from '@/pages/Overview/Construction'
import Fitout from '@/pages/ProjectDetails/Fitout';
import CirculationPlan from '@/pages/ProjectDetails/CirculationPlan'; 
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";


// import { Home } from '@/pages/Home';
// import { Suspense, 
// lazy
//  } from 'react';

// Lazy load heavy components for performance
// const Dashboard = lazy(() => import('./pages/Dashboard'));

export const router = createHashRouter([
  // The only public route. Everything below renders through
  // ProtectedRootLayout, which redirects here when there is no session.
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <ProjectDetailsPage />,
      },
    ]
  },

  {
    path: '/mobility',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <MobilityPage />,
      },
    ]
  },

  {
    path: '/vertical-transport',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <VerticalTransportPage />,
      },
    ]
  },

  {
    path: '/aboutus',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <AboutUsPage />,
      },
    ]
  },

  {
    path: '/walkthrough',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <Walkthrough />,
      },
    ]
  },
  {
    path: '/gallery',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <GalleryPage />,
      },
    ]
  },
  {
    path: '/overview',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <Overview />,
      },
    ]
  },
  {
    path: '/sustainability',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <Sustainability />,
      },
    ]
  },
  {
    path: '/concept_summary',
    element: <ProtectedRootLayout />,
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
    element: <ProtectedRootLayout />,
    children: [
      {
        path: 'unitplan/:id',
        element: <UnitPlanPage />,
      },
    ]
  },
   {
    path: '/',
    element: <ProtectedRootLayout />,
    children: [
      {
        path: 'projectinfo',
        element: <ProjectInfo />,
      },
    ]
  },
   {
    path: '/terrace-level',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <TerraceLevel />,
      },
    ]
  },
  {
    path: '/podium-level',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <PodiumLevel />,
      },
    ]
  },
  {
    path: '/ground-level',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <GroundLevel />,
      },
    ]
  },
  {
    path: '/lobby-reception',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <LobbyReception />,
      },
    ]
  },
  {
    path: '/fitout-plan',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <Fitout />,
      },
    ]
  },
  {
    path: '/circulation-plan',
    element: <ProtectedRootLayout />,
    children: [
      {
        index: true,
        element: <CirculationPlan />,
      },
    ]
  },
]);







