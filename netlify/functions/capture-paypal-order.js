const fetch = require('node-fetch');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const { orderID, orderId, payerId } = JSON.parse(event.body);
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const SECRET = process.env.PAYPAL_SECRET;
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    const data = await response.json();
    if (data.status === 'COMPLETED') {
      await db.collection('orders').doc(orderId).update({ status: 'paid' });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Capture not completed' })
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Capture failed' })
    };
  }
};