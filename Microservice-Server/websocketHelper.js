require('dotenv').config();



let allHospitals;
let allDoctors;
let doctor = {};
let hospital = {};

async function fetchAllDoctors() {
    if (allDoctors === undefined || allDoctors === null) {
        const response = await fetch(`${process.env.MAIN_SERVER_URL}/search/doctors`, { method: "GET" });
        if (!response.ok) {
            return {};
        }
        const data = await response.json();
        allDoctors = data;
    }
    return allDoctors;
}

async function fetchDoctorById(id) {
    if (doctor[id] === undefined || doctor[id] === null || doctor[id].length === 0) {
        try {
            const response = await fetch(`${process.env.MAIN_SERVER_URL}/search/doctors/${id}`, { method: "GET" });
            if (!response.ok) {
                return {};
            }
            const data = await response.json();
            doctor[id] = data;
        } catch (error) {
            console.error("Error fetching doctor by id:", error.message);
            return doctor[id] = null;
        }
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const formattedIndianDate = istDate.toISOString().split('T')[0];


    if(doctor[id].availableSlotsByDate[0].date < formattedIndianDate){
        console.log(`data is stale refetching doctor ${id} data`);
        doctor[id] = null;
        return fetchDoctorById(id);
    }else{
        // console.log(`data is fresh`);
    }

    return doctor[id];
}

async function fetchAllHospitals() {
    if (allHospitals === undefined || allHospitals === null) {
        try {
            const response = await fetch(`${process.env.MAIN_SERVER_URL}/search/hospitals`, { method: "GET" });
            if (!response.ok) {
                return {};
            }
            const data = await response.json();
            allHospitals = data;
        } catch (error) {
            console.error("Error fetching all hospitals:", error.message);
        }
    }
    return allHospitals;
}

async function fetchHospitalById(id) {
    if (hospital[id] === undefined || hospital[id] === null || hospital[id].length === 0) {
        try {
            const response = await fetch(`${process.env.MAIN_SERVER_URL}/search/hospitals/${id}/availability`, { method: "GET" });
            if (!response.ok) {
                return {};
            }
            const data = await response.json();
            hospital[id] = data;
        } catch (error) {
            console.error("Error fetching hospital by id:", error.message);
        }
    }
    return hospital[id];
}

async function updateAllHospitals(details) {
    allHospitals = details;
}

async function updateAllDoctors(details) {
    allDoctors = details;
}

async function updateDoctorById(id, details) {
    doctor[id] = details;
}

async function updateHospitalById(id, details) {
    hospital[id] = details;
}

function IndianTime(){
    const indianTime = new Date();
    indianTime.setUTCHours(indianTime.getUTCHours() + 5); // Add 5 hours for Indian Standard Time
    indianTime.setUTCMinutes(indianTime.getUTCMinutes() + 30); // Add additional 30 minutes for Indian Standard Time

    const startOfToday = new Date(indianTime);
    startOfToday.setUTCHours(0, 0, 0, 0);

    const endOfToday = new Date(indianTime);
    endOfToday.setUTCHours(23, 59, 59, 999);

    return {startOfToday, endOfToday};
}

module.exports = {
    fetchAllDoctors,
    fetchAllHospitals,
    fetchDoctorById,
    fetchHospitalById,
    updateAllHospitals,
    updateAllDoctors,
    updateDoctorById,
    updateHospitalById,
};
