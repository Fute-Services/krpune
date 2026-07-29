// const BASE_URL="https://krahejabackend.onrender.com/api";
// const BASE_URL= "http://103.133.214.185:5001/api";
const BASE_URL="https://api.krpune1.futeservices.in/api";

export async function fetchAPI<T>(endpoint:string): Promise<T>{
    const res=await fetch(`${BASE_URL}/${endpoint}/`);

    if(!res.ok){
        throw new Error(`Error: ${res.status}`);
    }
    return res.json();
}