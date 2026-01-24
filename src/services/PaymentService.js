/**
 * Payment Service - Kataraa
 * Integration with MyFatoorah for KNET and Credit Card payments in Kuwait.
 */

const BASE_URL_TEST = 'https://apitest.myfatoorah.com';
const BASE_URL_LIVE = 'https://api.myfatoorah.com';

class PaymentService {
    constructor() {
        this.apiKey = process.env.EXPO_PUBLIC_MYFATOORAH_API_KEY || '';
        this.isTest = process.env.EXPO_PUBLIC_PAYMENT_MODE !== 'live';
        this.baseUrl = this.isTest ? BASE_URL_TEST : BASE_URL_LIVE;
    }

    /**
     * Initiate a payment and get the redirection URL
     * @param {Object} paymentData 
     * @returns {Promise<Object>}
     */
    async initiatePayment(paymentData) {
        try {
            const response = await fetch(`${this.baseUrl}/v2/SendPayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    CustomerName: paymentData.customerName,
                    NotificationOption: 'LNK',
                    InvoiceValue: paymentData.amount,
                    DisplayCurrencyIso: 'KWD',
                    CustomerEmail: paymentData.email,
                    CallBackUrl: 'kataraa://checkout/success',
                    ErrorUrl: 'kataraa://checkout/payment?error=true',
                    Language: 'ar',
                    CustomerMobile: paymentData.mobile,
                    CustomerReference: paymentData.orderId,
                    UserDefinedField: paymentData.orderId,
                    // PaymentMethods: [{ PaymentMethodId: 1 }] // 1 = KNET
                })
            });

            const result = await response.json();

            if (result.IsSuccess) {
                return {
                    success: true,
                    invoiceId: result.Data.InvoiceId,
                    paymentUrl: result.Data.InvoiceURL
                };
            } else {
                console.error('MyFatoorah Error:', result.ValidationErrors || result.Message);
                return {
                    success: false,
                    error: result.Message || 'Payment initiation failed'
                };
            }
        } catch (error) {
            console.error('PaymentService error:', error);
            return {
                success: false,
                error: 'Connection error with payment gateway'
            };
        }
    }

    /**
     * Check the status of a transaction
     * @param {string} keyId 
     * @param {string} keyType 
     * @returns {Promise<Object>}
     */
    async getPaymentStatus(keyId, keyType = 'PaymentId') {
        try {
            const response = await fetch(`${this.baseUrl}/v2/GetPaymentStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    Key: keyId,
                    KeyType: keyType
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Status check error:', error);
            return { IsSuccess: false, Message: 'Failed to verify payment status' };
        }
    }
}

export default new PaymentService();
