// import building from '../../assets/project_details/building.webp'
import { Tooltip } from '@mui/material';
// import building from '../../assets/project_details/project_details_2.jpeg'
import building from '../../assets/project_details/TowerImage5.jpg'
import {getFloors} from '@/api/floorServices'
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
// import { floorData } from '../../data/FloorData';
export default function BuildingImage({ hoveredFloor, setHoveredFloor }: { hoveredFloor: number | null, setHoveredFloor: (id: number | null) => void }) {
    const navigate = useNavigate();
    const [floorData,setFloors]=useState([]);
    useEffect(()=>{
        const fetchData=async()=>{
            const res=await getFloors();
            setFloors(res.data.data);
            console.log("FloorData----------"+JSON.stringify(res.data))
          
           
        }
        fetchData()
    },[])
    // const [isSelected, setSelectedFloor] = useState<number | null>(null);
 
    return (<>
        <div className="relative w-screen  md:h-screen flex items-center justify-center ">

            {/* <img src={building} className='w-full h-full bg-cover'/> */}

            <svg
                // viewBox={floor.imageSettings.svgSize}
                // viewBox="0 0 2500 1876"
                viewBox="0 0 3877 1899"
                className="w-full h-auto drop-shadow-2xl lg:w-screen lg:h-screen   transition-transform duration-500"
                preserveAspectRatio="none"
            >
                <image
                    // href={floor.image3D}
                    // width={floor.imageSettings.imageWidth}
                    // height={floor.imageSettings.imageHeight}
                    href={building}
                    width="3877"
                    height="1899"
                />
                {/* {floor.units.map((unit) => {
                    const uniqueId = `${floor.id}-${unit.id}`;
                    const isSelected = selectedUnitId === uniqueId;
                    const isHovered = hoveredUnitId === uniqueId;

                    return ( */}
                {floorData.map((e:any) => {
                    

                    const floorId = e.id;
                    // 2. Correct the logic: Match variable to state
                    const isCurrentlyHovered = hoveredFloor === floorId;
                    // const isCurrentlySelected = isSelected === floorId;
                    return (

                        <Tooltip
                            key={floorId}
                            placement="right"
                            arrow
                            slotProps={{
                                tooltip: {
                                    style: {
                                        backgroundColor: 'transparent', // We build the background inside the title
                                        padding: 0,
                                        maxWidth: 'none',
                                        boxShadow: 'none',
                                    },
                                },
                                arrow: {
                                    style: { color: '#105CA8' }, // Match the blue of the tooltip
                                },
                            }}
                            title={
                                <div className="relative flex flex-col items-start filter drop-shadow-xl">
                                    {/* 1. The White Floor Badge */}
                                    <div style={{ backgroundColor: "white", marginLeft: "8px" }}
                                        className="rounded-tl-[19px] w-auto px-[10px] py-[5px] h-[48px] rounded-br-[17px]  mb-[-23px] 
                             z-10 text-center shadow-md rounded-bl-[5px] rounded-tr-[5px]">
                                        <h3 className="text-[#105CA8]  font-bold leading-wide flex flex-col "
                                            style={{ gap: "1px", display: "flex", flexDirection: "column", }}>
                                            <p className=' font-bold'
                                                style={{
                                                    fontSize: "18px", display: "flex", flexDirection: "row",
                                                    textAlign: "center", justifyContent: "center"
                                                }}>{e.id1}
                                                <span style={{ fontSize: "10px" }}>{e.tool2}</span></p>
                                            <span className='text-sm' style={{ fontSize: "9px" }}>{e.tool3}</span></h3>
                                        {/* <p className="text-[#105CA8] text-[9px] font-bold uppercase tracking-tighter">Floor</p> */}
                                    </div>

                                    {/* 2. The Main Blue Body */}
                                    <div
                                        className="bg-[#105CA8]  rounded-tl-[30px] rounded-tr-[10px]
                                         rounded-bl-[10px] rounded-br-[30px] rounded-br-[10px] w-auto"
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.2)', paddingTop: "25px",
                                            paddingBottom: "9px", paddingLeft: "20px", paddingRight: "20px", textAlign: "center", justifyContent: "center"
                                        }}
                                    >
                                        <p className="text-white text-[9px] font-bold  tracking-wider "
                                            style={{ marginBottom: "3px" }}>
                                            slab to slab  height
                                        </p>
                                        <p className="text-white/90 text-[9px] font-medium">
                                            4.20 meters
                                        </p>
                                    </div>
                                </div>
                            }
                        //  key={room.id}
                        //         title={`${room.name} - ${room.size}`}
                        //         arrow
                        //         placement="top"

                        // enterTouchDelay={0}
                        // leaveTouchDelay={3000} // Keeps it open for 3 seconds after tap


                        // open={isMobile() ? mobileTooltipRoomId === unit.id : undefined}

                        // disableFocusListener
                        // PopperProps={{
                        //     className: "pointer-events-none",
                        // }}

                        >
                            <polygon

                                points={e.polygon}
                                transform="translate(0, 5)"
                                // fill={
                                // isSelected ? "rgba(255, 112, 67, 0.6)" : 
                                //     isHovered ? unit.hoverColor : "transparent"}
                                // stroke={isHovered
                                //  ||
                                //  isSelected 
                                // ?
                                // "white" : "transparent"}
                                // }
                                fill={
                                    // isCurrentlySelected ? "#FF7043" : (
                                    isCurrentlyHovered ? e.hoverColor : "transparent"
                                    // )
                                }
                                strokeWidth="2"
                                className="cursor-pointer touch-safe transition-all duration-300"
                                //     onMouseEnter={() => setHoveredUnit(uniqueId)}
                                //     onMouseLeave={() => setHoveredUnit(null)}
                                //     onDoubleClick={() => handleUnitClick(unit.id)}
                                // onPointerUp={() => handleUnitClick(unit.id)}
                                // onPointerEnter={
                                //     !isMobile ? () => setHoveredUnit(uniqueId) : undefined
                                // }
                                // onPointerLeave={
                                //     !isMobile ? () => setHoveredUnit(null) : undefined
                                // }
                                // onClick={(e) => {
                                //         e.stopPropagation();
                                //         setClickedRoomId(
                                //             clickedRoomId === uniqueId ? null : uniqueId
                                //         );
                                //     }}

                                onMouseEnter={() => setHoveredFloor(floorId)}
                                onMouseLeave={() => setHoveredFloor(null)}
                                // onClick={() => navigate(`/unitplan/${floorId}`)}
                                onClick={() => {
                                    // Convert to number just in case it's a string, then check range
                                    const id = Number(floorId);
                                    //  if (id >= 1 && id <= 26 && id == 19) {
                                        navigate(`/unitplan/${id}`);
                                       
                                    // } else {
                                        console.warn("Navigation blocked: ID is out of range (1-3 only).");
                                    // }
                                }}
                            // onClick={() => setSelectedFloor(floorId)}
                            />
                        </Tooltip>)
                })}
                {/* ); */}
                {/* })} */}
            </svg>


        </div>
    </>)
}