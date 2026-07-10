import React, { useRef, useEffect } from 'react';
import { floorData } from '../../data/FloorData';
import { useNavigate } from 'react-router-dom';

interface FloorTableProps {
    hoveredFloor: number | null;
    setHoveredFloor: (id: number | null) => void;
}

export default function FloorTable({ hoveredFloor, setHoveredFloor }: FloorTableProps) {
    const tableRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const navigate = useNavigate();

    const customTableData = [
        { name: "R-1st Floor", t1: "71,731", t2: "30,929", id: 1 },
        { name: "2nd Floor", t1: "79,343", t2: "34,624", id: 2 },
        { name: "3rd Floor", t1: "79,343", t2: "34,624", id: 3 },
        { name: "4th Floor", t1: "79,343", t2: "34,624", id: 4 },
        { name: "R-5th Floor", t1: "71,731", t2: "30,929", id: 5 },
        { name: "6th Floor", t1: "79,343", t2: "34,624", id: 6 },
        { name: "7th Floor", t1: "79,343", t2: "34,624", id: 7 },
        { name: "8th Floor", t1: "79,343", t2: "34,624", id: 8 },
        { name: "R-9th Floor", t1: "71,731", t2: "30,929", id: 9 },
        { name: "10th Floor", t1: "79,343", t2: "34,624", id: 10 },
        { name: "11th Floor", t1: "81,708", t2: "35,606", id: 11 },
        { name: "12th Floor", t1: "81,708", t2: "35,606", id: 12 },
        { name: "R-13th Floor", t1: "74,031", t2: "31,858", id: 13 },
        { name: "14th Floor", t1: "81,708", t2: "35,606", id: 14 },
        { name: "15th Floor", t1: "81,708", t2: "35,606", id: 15 },
        { name: "16th Floor", t1: "81,708", t2: "35,606", id: 16 },
        { name: "17th Floor", t1: "81,708", t2: "35,606", id: 17 },
        { name: "Lower Gr.Flr", t1: "34,947", t2: "-", id: 19 },
        { name: "Upper Gr.Flr", t1: "1,048", t2: "15,175", id: 18 },
        { name: "Podium 1", t1: "-", t2: "651", id: 20 },
        { name: "Amenity", t1: "31,231", t2: "14,994", id: null },
        { name: "Amenity", t1: "52,391", t2: "18,067", id: null },

    ];

    const isHoveringTable = useRef(false);

    useEffect(() => {
        if (isHoveringTable.current) return;

        if (hoveredFloor && rowRefs.current[hoveredFloor] && tableRef.current) {
            const rowElement = rowRefs.current[hoveredFloor] as HTMLDivElement;
            const container = tableRef.current;
            
            // Calculate the top position relative to the container,
            // and subtract the stick header's estimated height (about 45px)
            const headerOffset = 45;
            const topPosition = rowElement.offsetTop - headerOffset;
            
            container.scrollTo({
                top: topPosition,
                behavior: 'smooth',
            });
        }
    }, [hoveredFloor]);

    return (
        <div
            ref={tableRef}
            onMouseEnter={() => isHoveringTable.current = true}
            onMouseLeave={() => isHoveringTable.current = false}
            className="w-[170px] md:w-[190px] lg:w-[310px] md:max-w-[30vh] lg:max-w-[310px] w-[18vh] mt-[120px] h-[20vh] md:h-[30vh] lg:h-full max-h-[35vh] lg:max-h-[45vh] mt-[80px] md:mt-[100px] lg:mt-[50px] lg:mr-[50px] overflow-y-auto bg-[#2b3a4a]/60 rounded-md border border-white/10 shadow-2xl backdrop-blur-md block"
            style={{
                fontFamily: "Poppins, sans-serif",
                scrollbarWidth: 'thin',
                scrollbarColor: '#4b5f71 transparent'
            }}
        >
            <div className="sticky top-0 bg-[#1e2a38] opacity-[0.8] z-10 border-b border-white/20 text-white font-semibold text-[9px] md:text-xs lg:text-sm flex px-1 md:px-2 justify-between">
                <div className="py-3 flex-1 text-center border-r border-white/10">Floor</div>
                <div className="py-3 flex-[1.5] text-center border-r border-white/10">Tower 1 sqft</div>
                <div className="py-3 flex-[1.5] text-center">Tower 2 sqft</div>
            </div>

            <div className="flex flex-col">
                {customTableData.map((row, index) => {
                    const isHovered = row.id !== null && hoveredFloor === row.id;

                    return (
                        <div
                            key={index}
                            ref={(el) => { if (row.id !== null) rowRefs.current[row.id] = el; }}
                            className={`flex text-[8px] md:text-[11px] xl:text-[13px] text-white/90 cursor-pointer transition-colors border-b border-white/5 
                                ${isHovered ? 'bg-[#003264]  text-white font-bold shadow-inner'
                                    : 'hover:bg-white/10'}`}
                            onMouseEnter={() => row.id !== null && setHoveredFloor(row.id)}
                            onMouseLeave={() => setHoveredFloor(null)}
                            onClick={() => {
                                if (row.id !== null && row.id >= 1 && row.id <= 26 && row.id !== 19) {
                                    navigate(`/unitplan/${row.id}`);
                                }
                            }}
                        >
                            <div className="px-2 py-2 flex-1 flex items-center border-r border-white/5">{row.name}</div>
                            <div className="px-2 py-2 flex-[0.8] text-center flex items-center justify-center border-r border-white/5 whitespace-nowrap overflow-hidden text-ellipsis">{row.t1}</div>
                            <div className="px-2 py-2 flex-[0.8] text-center flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis">{row.t2}</div>
                        </div>
                    );
                })}
            </div>

            <style>
                {`
                div::-webkit-scrollbar {
                    width: 6px;
                }
                div::-webkit-scrollbar-track {
                    background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                    background-color: #4b5f71;
                    border-radius: 10px;
                }
                `}
            </style>
        </div>
    );
}