const express = require('express');

const router = express.Router();

const { updateDoctorById, updateHospitalById } = require('../websocketHelper');
const { broadcastToUser, broadcastUpdatedDetails } = require('../websocketServer');


router.patch('/doctors/:id', async (req, res) => {
    const { availableSlotsByDate, availableForConsult } = req.body;

    const { id } = req.params;
    
    const details = {
        availableForConsult,
        availableSlotsByDate
    }

    await updateDoctorById(id, details);
    await broadcastUpdatedDetails('doctor', details, id);

    return res.json({msg: 'Doctor updated'});
});

router.patch('/hospitals/:id', async (req, res) => {
    const { availableForConsult } = req.body;

    const { id } = req.params;
    console.log(availableForConsult);
    const details = {
        availableForConsult
    }
    
    await updateHospitalById(id, details);
    
    await broadcastUpdatedDetails('hospital', details, id);

    return res.json({msg: 'Hospital updated'});
});


module.exports = router;