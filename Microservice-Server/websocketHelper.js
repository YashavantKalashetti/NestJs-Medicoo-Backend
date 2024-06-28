require('dotenv').config();
const { broadcastUpdatedDetails } = require('./websocketServer'); // Ensure correct import

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
        console.log(`data not cached`);
        const response = await fetch(`${process.env.MAIN_SERVER_URL}/search/doctors/${id}`, { method: "GET" });
        if (!response.ok) {
            return {};
        }
        const data = await response.json();
        doctor[id] = data;
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
