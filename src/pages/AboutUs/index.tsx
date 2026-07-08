import AboutUs from '@/pages/ProjectDetails/AboutUs';

export default function AboutUsPage() {
  const handleClose = () => window.history.back();
  const handleOpen = () => {};
  return <AboutUs handleClose={handleClose} handleOpen={handleOpen} />;
}

