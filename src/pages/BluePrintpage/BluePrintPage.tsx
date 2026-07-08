import { useLocation } from "react-router-dom";

type BlueprintData = {
  floor?: string;
  unit?: string;
  image?: string;
};

export default function BlueprintPage() {
  const location = useLocation();
  const data = location.state as BlueprintData | null;

  console.log("location.state:", location.state);
  console.log("data:", data);

  return (
    <>
      <div
        className="flex flex-col items-center w-full h-screen overflow-hidden"
        style={{ color: "#1E3A8A" }}
      >
        {data?.image ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full flex flex-col items-center">
            <div className="py-8 px-4 text-center">
              <h2 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-1">
                Unit Specifications
              </h2>

              <p
                className="text-2xl md:text-3xl lg:text-3xl font-light text-neutral-900"
                style={{ margin: "10px" }}
              >
                Floor{" "}
                <span className="font-semibold" style={{ fontSize: "20px" }}>
                  {data.floor}
                </span>
              </p>
            </div>

            <div className="w-[65%] h-full relative group">
              <img
                src={data.image}
                alt="Blueprint"
                className="w-full h-auto object-contain shadow-inner lg:max-h-[85vh]"
              />
              <div className="absolute inset-0 pointer-events-none border-y border-black/5 ring-1 ring-inset ring-white/10" />
            </div>
          </div>
        ) : (
          <div className="mt-20 flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>

            <p className="text-red-800 font-medium tracking-tight bg-red-50 px-6 py-2 rounded-full border border-red-100">
              Unit not found
            </p>
          </div>
        )}
      </div>
    </>
  );
}