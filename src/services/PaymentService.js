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
            if (!this.apiKey) {
                console.error('❌ MyFatoorah API Key is missing! Please set EXPO_PUBLIC_MYFATOORAH_API_KEY in your .env file.');
                return {
                    success: false,
                    error: 'Payment gateway configuration is missing'
                };
            }

            console.log(`💳 Initiating payment for order ${paymentData.orderId} via ${this.baseUrl}`);
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
                    ErrorUrl: 'kataraa://checkout?paymentError=true',
                    Language: 'ar',
                    CustomerMobile: paymentData.mobile,
                    CustomerReference: paymentData.orderId,
                    UserDefinedField: paymentData.orderId,
                })
            });

            const responseText = await response.text();

            if (!responseText) {
                console.error(`❌ Empty response from MyFatoorah (Status: ${response.status})`);
                throw new Error(`Empty response from payment gateway (Status: ${response.status})`);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse MyFatoorah response:', responseText);
                throw new Error(`Invalid JSON response from gateway (Status: ${response.status})`);
            }

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
                error: error.message || 'Connection error with payment gateway'
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
            console.log(`🔍 Checking payment status for ${keyId}`);
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

            const responseText = await response.text();
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse status response:', responseText);
                return { IsSuccess: false, Message: `Invalid server response (${response.status})` };
            }
        } catch (error) {
            console.error('Status check error:', error);
            return { IsSuccess: false, Message: 'Failed to verify payment status' };
        }
    }
}

export default new PaymentService();
