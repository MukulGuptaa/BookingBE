/**
 * Interface that all payment providers must implement.
 * Using a class to simulate an interface in JS.
 */
class PaymentGatewayInterface {
    /**
     * Initiate a payment request.
     * @param {Object} params
     * @param {number} params.amount - Amount in smallest currency unit (e.g. paise for INR) or standard unit depending on provider.
     * @param {string} params.orderId - Unique order ID.
     * @param {Object} params.userInfo - User details (id, phone, etc).
     * @returns {Promise<{transactionId: string, redirectUrl: string, payload: Object}>}
     */
    async initiatePayment(params) {
        throw new Error('Method not implemented: initiatePayment');
    }

    /**
     * Check the status of a payment.
     * @param {string} transactionId - The transaction ID returned by initiatePayment.
     * @returns {Promise<{status: 'SUCCESS' | 'FAILED' | 'PENDING', raw: Object}>}
     */
    async verifyPayment(transactionId) {
        throw new Error('Method not implemented: verifyPayment');
    }
}

module.exports = PaymentGatewayInterface;
