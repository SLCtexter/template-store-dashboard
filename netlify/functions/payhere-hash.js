// netlify/functions/payhere-hash.js
const crypto = require('crypto');

exports.handler = async (event) => {
  const { orderId, amount } = JSON.parse(event.body);
  const merchantId = process.env.PAYHERE_MERCHANT_ID; // 1234923
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const currency = 'LKR';

  const formattedAmount = parseFloat(amount).toFixed(2);

  const md5Secret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + formattedAmount + currency + md5Secret;
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  return {
    statusCode: 200,
    body: JSON.stringify({ hash })
  };
};