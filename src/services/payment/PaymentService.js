const PhonePeProvider = require('./PhonePeProvider');

class PaymentService {
    constructor() {
        // Dependency Injection - Hardcoded to PhonePe for now, but easily swappable
        this.provider = new PhonePeProvider();
    }

    async initiatePayment(params) {
        return await this.provider.initiatePayment(params);
    }

    async verifyPayment(transactionId) {
        return await this.provider.verifyPayment(transactionId);
    }
}

module.exports = new PaymentService();
