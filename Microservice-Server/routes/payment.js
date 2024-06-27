require('dotenv').config();
const express = require('express');

const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.get("/create-checkout-session", async (req, res) => {

    const { price, success_url, cancel_url } = req.body;

    try {

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [ {
            price_data: {
              currency: "inr",
              product_data: {
                name: "Appointment fees",
              },
              unit_amount: price * 100 || 500 * 100,
            },
            quantity: 1,
          }],
        success_url: success_url || `http://localhost:3000/payment/successful`,
        cancel_url: cancel_url || `http://localhost:3000/payment/cancel`,
      })

    //   console.log(session)

      return res.json({ url: session.url })

    } catch (e) {
      console.log(e.message)
      return res.status(500).json({ error: e.message })
    }
})

module.exports = router;