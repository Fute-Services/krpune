import ButtonDiv from '@/pages/Amenities/AmenitiesButtons';

// The About Us overlay used to live on this page too. Nothing ever set
// showAboutUs true — the panel is reached from Project Details and from its own
// /aboutus route — so the state, its two handlers, the <AboutUs> import and the
// background image were all dead weight, and the `!showAboutUs` guard below was
// permanently true.
export default function AmenitiesPage() {

  return (
    <>
      <div 
  className="relative w-full h-screen overflow-hidden
             bg-no-repeat bg-cover
             bg-[40%_center] md:bg-top lg:bg-center"
  style={{
    backgroundImage: `url(${import.meta.env.BASE_URL}media/amenities/cam_4_2_igzh94.png)`,
    backgroundColor: '#000' // Optional: adds a black bar background
  }}
>

        {/* Updated ButtonDiv with 4 buttons */}
        <div className='fixed z-[1200] lg:-translate-x-[90%] lg:left-[90%] md:left-[95%] md:top-[75%] lg:top-[85%] left-[90%] top-[78%] lg:-translate-y-[90%] -translate-y-[80%] -translate-x-[90%]'>
          <ButtonDiv />
        </div>

      </div>
    </>
  );
}