const express = require('express');

const router = express.Router();

const { updateDoctorById, updateHospitalById } = require('../websocketHelper');
const { broadcastToUser, broadcastUpdatedDetails } = require('../websocketServer');


router.patch('/doctors/:id', async (req, res) => {
    const { id, doctor, availableSlotsByDate } = req.body;

    
    const details = {
        doctor,
        availableSlotsByDate
    }
    
    await updateDoctorById(id, details);

    await broadcastUpdatedDetails('doctor', details, id);

    return res.json({msg: 'Doctor updated'});
});

router.patch('/hospitals/:id', async (req, res) => {
    const { id, availableForConsult } = req.body;

    const details = {
        availableForConsult
    }
    
    await updateHospitalById(id, details);
    
    await broadcastUpdatedDetails('hospital', details, id);

    return res.json({msg: 'Hospital updated'});
});


module.exports = router;