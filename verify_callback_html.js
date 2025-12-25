const fetch = require('node-fetch');

async function testCallback() {
    console.log('--- Testing Callback HTML Response ---');
    try {
        // Mock a simple payload. The server expects { code: ..., data: { ... } }
        // or base64 encoded 'response' field.
        // Let's send the direct JSON structure handled by the logic:
        // if (decodedResponse.code === 'PAYMENT_SUCCESS' ...)

        const payload = {
            code: 'PAYMENT_SUCCESS',
            data: {
                merchantTransactionId: 'TEST_TXN_ID',
                amount: 10000
            }
        };

        const res = await fetch('http://localhost:5002/api/payments/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Content-Type:', res.headers.get('content-type'));

        if (text.includes('<html>') && text.includes('Payment Successful')) {
            console.log('✅ SUCCESS: Received HTML Success Page');
        } else if (text.includes('<html>') && text.includes('Payment Failed')) {
            console.log('⚠️  RECEIVED HTML FAILURE (Expected if logic fell through)');
        } else {
            console.log('❌ FAILED: Did not receive HTML. Content Start:', text.substring(0, 100));
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

testCallback();
