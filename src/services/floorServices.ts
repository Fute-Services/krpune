import axiosInstance from '../api/axiosInstance';

export const getFloors=()=>{
    return axiosInstance.get("/floors");
}