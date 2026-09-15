import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'

export default function App() {
  return (<>
    {/* <BrowserRouter>

      <Sidebar/>

      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vr" element={<Vr />} />
          <Route path="/projectDetails" element={<ProjectDetails />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/location" element={<Location />} />
        </Routes>
      </div>

    </BrowserRouter> */}
    <RouterProvider router={router} />
  </>

  );
}