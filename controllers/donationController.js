import asyncHandler from "../middlewares/asyncHandler.js";
import Stripe from 'stripe';
import {
  getAllDonations,
  getDonationById as modelGetById,
  createDonation as modelCreate,
  updateDonation as modelUpdate,
  deleteDonation as modelDelete,
  getDonationsByUser as modelGetByUser,
  getRecentPublicDonations as modelGetRecent,
  queryDonations as modelQuery,
} from "../models/donationModel.js";

const stripe = new Stripe('sk_test_51PNVMB00Cl7fHLHIAGakAVzkF90LFl5BTiXWAk69DJsi1RvXdl1yQiZxqOY4urW7HbNyENVdGLeM0CC9qAIfSbG900WepmZydd')

// GET /api/donations
// Optional filters via query: type, status, publicOnly, minAmount, maxAmount
export const listDonations = asyncHandler(async (req, res) => {
  const { type, status, publicOnly, minAmount, maxAmount } = req.query;
  const hasFilters = [type, status, publicOnly, minAmount, maxAmount].some(
    (v) => v !== undefined
  );

  if (hasFilters) {
    const list = await modelQuery({
      type,
      status,
      publicOnly: publicOnly === "true" || publicOnly === true,
      minAmount,
      maxAmount,
    });
    return res.json(list);
  }

  const list = await getAllDonations();
  res.json(list);
});

// POST /api/donations
// Body: { donor?, amount, type?, date?, status?, receipt?, userId?, email?, isPublic?, note? }
// If authenticated (JWT), auto-associate with user (id, email, name)
export const processCheckoutPayment = asyncHandler(async (req, res) => {
  try {
    const { amount, name= "jeevan@gmail.com", currency = 'inr' } = req.body ?? {};
    if (amount === undefined || Number.isNaN(Number(amount))) {
      res.status(400);
      throw new Error("Amount is required and must be a number");
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // UPI works with INR; cards work globally.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // UPI + Card (Stripe will show PhonePe/GPay/Paytm under UPI on Indian accounts)
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: 'Donation' },
            unit_amount: Math.round(Number(amount) * 100), // smallest currency unit
          },
          quantity: 1,
        },
      ],
      success_url: process.env.CLIENT_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CLIENT_CANCEL_URL,
      customer_email: name || undefined, // optional
      metadata: {
        // put your own IDs here if needed
        project: 'donation-site',
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(500).json({ error: 'Unable to create session' });
  }
});

export const submitDonation = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  console.log(req)

  console.log("yaha kuch to aya h ")

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verify failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if(event.type === 'invoice.payment_succeeded'){
    console.log('case invoice.payment_succeeded')
  }
  // Handle events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // 💾 Save to DB here (pseudo):
    // await Donations.create({
    //   amount: session.amount_total,
    //   currency: session.currency,
    //   email: session.customer_details?.email,
    //   payment_intent: session.payment_intent,
    //   status: 'succeeded',
    //   metadata: session.metadata,
    // });

    console.log('✅ Donation received:', {
      amount: session.amount_total / 100,
      currency: session.currency,
      email: session.customer_details?.email,
    });
  }

  res.json({ received: true });
});


//  export const submitDonation = asyncHandler(async (req, res) => {
//    const { amount } = req.body ?? {};
//    if (amount === undefined || Number.isNaN(Number(amount))) {
//      res.status(400);
//      throw new Error("Amount is required and must be a number");
//    }

//    const base = { ...(req.body ?? {}) };
//    if (req.user) {
//      if (!base.userId) base.userId = req.user.id;
//      if (!base.email) base.email = req.user.email;
//      if (!base.donor && req.user.name) base.donor = req.user.name;
//    }

//    const donation = await modelCreate(base);
//    res.status(201).json(donation);
//  });


// GET /api/donations/recent?limit=10
export const recentPublicDonations = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const list = await modelGetRecent(limit ? Number(limit) : undefined);
  res.json(list);
});

// GET /api/donations/user/:userId
export const donationsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const list = await modelGetByUser({ userId });
  res.json(list);
});

// GET /api/donations/by-email/:email
export const donationsByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const list = await modelGetByUser({ email });
  res.json(list);
});

// GET /api/donations/:id
export const getDonation = asyncHandler(async (req, res) => {
  const donation = await modelGetById(req.params.id);
  if (!donation) {
    res.status(404);
    throw new Error("Donation not found");
  }
  res.json(donation);
});

// PUT /api/donations/:id
export const updateDonation = asyncHandler(async (req, res) => {
  const updated = await modelUpdate(req.params.id, req.body ?? {});
  if (!updated) {
    res.status(404);
    throw new Error("Donation not found");
  }
  res.json(updated);
});

// DELETE /api/donations/:id
export const deleteDonation = asyncHandler(async (req, res) => {
  const ok = await modelDelete(req.params.id);
  if (!ok) {
    res.status(404);
    throw new Error("Donation not found");
  }
  res.json({ message: "Donation deleted" });
});
