const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { amount, currency, orderId } = JSON.parse(event.body);
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const SECRET = process.env.PAYPAL_SECRET;
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');

    // PayPal order create API call with return_url
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency || 'USD',
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          return_url: `${process.env.URL}/paypal-return`,
          cancel_url: `${process.env.URL}/checkout`
        }
      })
    });

    const data = await response.json();
    const approvalLink = data.links.find(link => link.rel === 'approve').href;
    return {
      statusCode: 200,
      body: JSON.stringify({ approval_url: approvalLink, orderId: data.id })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create PayPal order' })
    };
  }
};