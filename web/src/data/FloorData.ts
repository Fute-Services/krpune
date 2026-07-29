// import image2d from '../assets/unit/floor1to17same.png';
import image2d from '../assets/project_details/unitImagenew12D.png';
import image3d from '../assets/unit/floor1to17.png'
import mlcp1 from '../assets/project_details/parking1-2d.jpg'
import mlcp2 from '../assets/project_details/parking2-2d.jpg'
import mlcp3 from '../assets/project_details/parking3-2d.jpg'
import mlcp4 from '../assets/project_details/parking4-2d.jpg'
import mlcp5 from '../assets/project_details/parking5-2d.jpg'
import mlcp6 from '../assets/project_details/parking6-2d.jpg'
// import mlcp11 from '../assets/project_details/parking floor1.png'
import mlcp11 from '../assets/newFloor/parking floor1.png'
import mlcp22 from '../assets/project_details/parking floor2.png'
import mlcp33 from '../assets/project_details/parking floor3.png'
import mlcp44 from '../assets/project_details/parking floor4.png'
import mlcp55 from '../assets/project_details/parking floor5.png'
import mlcp66 from '../assets/project_details/parking floor6.png'

import podium3d from '../assets/project_details/podium 1.png'
import podium2d from '../assets/project_details/podium.jpg'

// import upper3d from '../assets/project_details/upper3d.png'
import upper3d from '../assets/newFloor/upper3d.png'
import upper2d from '../assets/project_details/Upper 2d.jpg'

import floor2 from '../assets/flooroverlay/floor-2overlay.png'
import floor3 from '../assets/flooroverlay/floor-3overlay.png'
import floor4 from '../assets/flooroverlay/floor-4overlay.png'
import floor5 from '../assets/flooroverlay/floor-5overlay.png'
import floor6 from '../assets/flooroverlay/floor-6overlay.png'
import floor7 from '../assets/flooroverlay/floor-7overlay.png'
import floor8 from '../assets/flooroverlay/floor-8overlay.png'
import floor9 from '../assets/flooroverlay/floor-9overlay.png'
import floor10 from '../assets/flooroverlay/floor-10overlay.png'
import floor11 from '../assets/flooroverlay/floor-11overlay.png'
import floor12 from '../assets/flooroverlay/floor-12overlay.png'
import floor13 from '../assets/flooroverlay/floor-13overlay.png'
import floor14 from '../assets/flooroverlay/floor-14overlay.png'
import floor15 from '../assets/flooroverlay/floor-15overlay.png'
import floor16 from '../assets/flooroverlay/floor-16overlay.png'
import floor17 from '../assets/flooroverlay/floor-17overlay.png'



export const floorData = [
    {
        id: 1, name: "Floor-1",
        tool1: "1st", tool2: "st", id1: "1",
        tool3: "Refuge Floor", polygon: "1526,1617,1526,1696,3809,1696,3804,1607",
        hoverColor: "rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 101, floorname: "Floor-1", polygon: "", tooltip: "",
                // image3D: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776662835/floor1to17_cgmn7e.png",
                 image2D: image2d,
                // image2D: "https://res.cloudinary.com/db0f2ofgf/image/upload/v1776662715/unitImagenew12D_nhwxh9.png",
                image3D: image3d,

                unitInformation: {

                    title: "Carpet Square.ft", T1: "71731", T2: "30929"

                },

                sideContent: [

                    { id: 1, name: "1st Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }

                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 2, name: "Floor-2", tool1: "2nd", tool2: "nd", id1: "2", tool3: "Floor", polygon: "1526,1528,1526,1607,3809,1607,3804,1518", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 201, floorname: "Floor-2", polygon: "", tooltip: "",
                image3D: image3d, image2D: image2d,
                overlayImage: floor2,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "2nd Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 3, name: "Floor-3", tool1: "3rd", tool2: "rd", id1: "3", tool3: "Floor", polygon: "1521,1434,1521,1513,3804,1513,3799,1424", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 301, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor3,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "3rd Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 4, name: "Floor-4", tool1: "4th", tool2: "th", id1: "4", tool3: "Floor", polygon: "1516,1344,1516,1423,3799,1423,3794,1334", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 401, floorname: "Floor-1", polygon: "", tooltip: ""

                , overlayImage: floor4,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "4th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 5, name: "Floor-5", tool1: "5th", tool2: "th", id1: "5", tool3: "Refuge Floor", polygon: "1521,1259,1521,1338,3804,1338,3799,1249", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 501, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor5,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "71731", T2: "30929"

                },
                sideContent: [
                    { id: 1, name: "5th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]

            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 6, name: "Floor-6", tool1: "6th", tool2: "th", id1: "6", tool3: "Floor", polygon: "1526,1169,1526,1248,3809,1248,3804,1159", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 601, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor6,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "6th Floor" }, // Header item
                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 7, name: "Floor-7", tool1: "7th", tool2: "th", id1: "7", tool3: "Floor", polygon: "1531,1069,1531,1148,3814,1148,3809,1059", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 701, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor7,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "7th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 8, name: "Floor-8", tool1: "8th", tool2: "th", id1: "8", tool3: "Floor", polygon: "1531,989,1531,1068,3814,1068,3809,979", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 801, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor8,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "8th Floor" }, // Header item
                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 9, name: "Floor-9", tool1: "9th", tool2: "th", id1: "9", tool3: "Refuge", polygon: "1531,894,1531,973,3814,973,3809,884", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 901, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor9,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "71731", T2: "30929"

                },
                sideContent: [
                    { id: 1, name: "9th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 10, name: "Floor-10", tool1: "10th", tool2: "th", id1: "10", tool3: "Floor", polygon: "1531,815,1531,894,3814,894,3809,805", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 1001, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor10,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "79343", T2: "34624"

                },
                sideContent: [
                    { id: 1, name: "10th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 11, name: "Floor-11", tool1: "11th", tool2: "th", id1: "11", tool3: "Floor", polygon: "1531,730,1531,809,3814,809,3809,720", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 1101, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor11,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "11th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 12, name: "Floor-12", tool1: "12th", tool2: "th", id1: "12", tool3: "Floor", polygon: "1531,636,1531,715,3814,715,3809,626", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 1201, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor12,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "12th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 13, name: "Floor-13", tool1: "13th", tool2: "th", id1: "13", tool3: "Refuge Floor", polygon: "1516,542,1516,621,3799,621,3794,532", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1301, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor13,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "74031", T2: "31858"

                },
                sideContent: [
                    { id: 1, name: "13th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 14, name: "Floor-14", tool1: "14th", tool2: "th", id1: "14", tool3: "Floor", polygon: "1526,457,1526,536,3809,536,3804,447", hoverColor: "rgba(241,241,243,0.6) "
        ,

        units: [
            {
                id: 1401, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor14,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "14th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 15, name: "Floor-15", tool1: "15th", tool2: "th", id1: "15", tool3: "Floor", polygon: "1516,377,1516,456,3799,456,3794,367", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1501, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor15,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "15th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]

            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 16, name: "Floor-16", tool1: "16th", tool2: "th", id1: "16", tool3: "Floor", polygon: "1516,287,1516,366,3799,366,3794,277", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1601, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor16,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "16th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 17, name: "Floor-17", tool1: "17th", tool2: "th", id1: "17", tool3: "Floor", polygon: "1516,192,1516,271,3799,271,3794,182", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1701, floorname: "Floor-1", polygon: "", tooltip: ""
                , overlayImage: floor17,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "81708", T2: "35606"

                },
                sideContent: [
                    { id: 1, name: "17th Floor" }, // Header item

                    { id: 3, name: "1) Services lift lobby" },
                    { id: 4, name: "2) AHU room" },
                    { id: 5, name: "3) Fire tower" },
                    { id: 6, name: "4) Services balcony" },
                    { id: 7, name: "5) Fire Staircase" },
                    { id: 8, name: "6) Service staircase" },
                    { id: 9, name: "7) Server room" },
                    { id: 10, name: "8) toilet" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 18, name: "upper gf", tool1: "", tool2: "Upper Ground floor", id1: "", tool3: "", polygon: "1428,2255,1423,2480,3931,2480,3926,2260", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1801, floorname: "Floor-1", polygon: "", tooltip: ""
                ,
                image3D: upper3d, image2D: upper2d,
                unitInformation: {

                    title: "Carpet Square.ft", T1: "1048", T2: "15175"

                },
                sideContent: [
                    { id: 1, name: "1 Floor" }, // Header item

                    { id: 3, name: "Office space" },
                    { id: 4, name: "Lift lobby" },
                    { id: 5, name: "Fire tower" },
                    { id: 6, name: "Services balcony" },
                    { id: 7, name: "Fire escape staircase" },
                    { id: 8, name: "Lift shaft" },
                    { id: 9, name: "Services shaft" },
                    { id: 10, name: "AHU room" },
                    { id: 11, name: "Gent's Restroom" },
                    { id: 12, name: "Ladies' Restroom" },
                    { id: 13, name: "Refuge balcony" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 19, name: "MLCP-6Level ", tool1: "", tool2: "MLCP-6Level", id1: "", tool3: "", polygon: "3428,1786,4024,1791,4024,2260,3437,2260", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 1801, floorname: "Floor-1", polygon: "", tooltip: ""
                ,
                image3D: image3d, image2D: image2d,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "1 Floor" }, // Header item

                    { id: 3, name: "Office space" },
                    { id: 4, name: "Lift lobby" },
                    { id: 5, name: "Fire tower" },
                    { id: 6, name: "Services balcony" },
                    { id: 7, name: "Fire escape staircase" },
                    { id: 8, name: "Lift shaft" },
                    { id: 9, name: "Services shaft" },
                    { id: 10, name: "AHU room" },
                    { id: 11, name: "Gent's Restroom" },
                    { id: 12, name: "Ladies' Restroom" },
                    { id: 13, name: "Refuge balcony" }
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 20, name: "Podium Level ", tool1: "", tool2: "Podium Level", id1: "", tool3: "", polygon: "1529,1703,1529,1791,3814,1786,3809,1698", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Floor-1", polygon: "", tooltip: ""
                ,

                image3D: podium3d, image2D: podium2d,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "Podium" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                    { id: 11, name: "Working pods" },
                    { id: 12, name: "Food Kiosk" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 21, name: "MLCP-1 ", tool1: "", tool2: "MLCP-1 Level", id1: "", tool3: "", polygon: "1352,2177,3445,2170,3445,2240,1352,2247", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Floor-1", polygon: "", tooltip: ""
                ,
                image3D: mlcp11, image2D: mlcp1,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 1" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },

                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 22, name: "MLCP-2", tool1: "", tool2: "MLCP-2 Level", id1: "", tool3: "", polygon: "1352,2107,3445,2107,3445,2177,1352,2177", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Parking 2", polygon: "", tooltip: ""
                ,
                image3D: mlcp22, image2D: mlcp2,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 2" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 23, name: "MLCP-3", tool1: "", tool2: "MLCP-3 Level", id1: "", tool3: "", polygon: "1352,2045,3445,2037,3445,2107,1352,2107 ", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Parking 3", polygon: "", tooltip: ""
                ,
                image3D: mlcp33, image2D: mlcp3,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 3" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 24, name: "MLCP-4", tool1: "", tool2: "MLCP-4 Level", id1: "", tool3: "", polygon: "1352,1983,3445,1967,3453,2037,1352,2045", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Parking 4", polygon: "", tooltip: ""
                ,
                image3D: mlcp44, image2D: mlcp4,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 4" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },

    {
        id: 25, name: "MLCP-5", tool1: "", tool2: "MLCP-5 Level", id1: "", tool3: "", polygon: "1363,1878,1363,1980,3448,1971,3443,1873", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Parking 5", polygon: "", tooltip: ""
                ,
                image3D: mlcp55, image2D: mlcp5,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 5" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },
    {
        id: 26, name: "MLCP-6", tool1: "", tool2: "MLCP-6 Level", id1: "", tool3: "", polygon: "1367,1785,3448,1785,3448,1868,1363,1883", hoverColor: " rgba(241,241,243,0.6)"
        ,

        units: [
            {
                id: 2001, floorname: "Parking 6", polygon: "", tooltip: ""
                ,
                image3D: mlcp66, image2D: mlcp6,
                unitInformation: {

                    // title:"Carpet Square.ft",T1:"71731",T2:"30929"

                },
                sideContent: [
                    { id: 1, name: "MLCP 6" }, // Header item

                    { id: 3, name: "Transfer Lobby" },
                    { id: 4, name: "Fire Staircase" },
                    { id: 5, name: "Service Lift" },
                    { id: 6, name: "Service Stair" },
                    { id: 7, name: "Staircase" },
                    { id: 8, name: "Ladies Toilet" },
                    { id: 9, name: "Gents Toilet" },
                    { id: 10, name: "Electric Room" },
                ]
            },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
            // { id: 101, floorname: "Floor-1", polygon: "", tooltip: "" },
        ],
    },



]