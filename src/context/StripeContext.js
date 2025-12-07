/**
 * Stripe Context Provider
 * Wraps the app with Stripe functionality
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { StripeProvider, useStripe, CardField } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../config/stripe';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';

// Create context
const StripeContext = createContext(null);

/**
 * Stripe Provider Component
 */
export function StripePaymentProvider({ children }) {
    return (
        <StripeProvider
            publishableKey={STRIPE_CONFIG.PUBLISHABLE_KEY}
            merchantIdentifier={STRIPE_CONFIG.APPLE_PAY.merchantId}
            urlScheme={STRIPE_CONFIG.URL_SCHEME}
        >
            <StripePaymentContextProvider>
                {children}
            </StripePaymentContextProvider>
        </StripeProvider>
    );
}

/**
 * Internal provider with Stripe hooks
 */
function StripePaymentContextProvider({ children }) {
    const stripe = useStripe();
    const [loading, setLoading] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

    /**
     * Process card payment
     */
    const processCardPayment = useCallback(async (amount, orderId, billingDetails = {}) => {
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        setLoading(true);
        try {
            // Step 1: Create payment intent on server
            const intentResult = await createPaymentIntent({
                amount,
                currency: STRIPE_CONFIG.CURRENCY,
                orderId,
                metadata: { orderId },
            });

            if (!intentResult.success) {
                throw new Error(intentResult.message || 'Failed to create payment intent');
            }

            // Step 2: Confirm payment with card details
            const { error, paymentIntent } = await stripe.confirmPayment(
                intentResult.clientSecret,
                {
                    paymentMethodType: 'Card',
                    paymentMethodData: {
                        billingDetails: {
                            name: billingDetails.name,
                            email: billingDetails.email,
                            phone: billingDetails.phone,
                            address: {
                                city: billingDetails.city,
                                country: billingDetails.country,
                                line1: billingDetails.address,
                                postalCode: billingDetails.postalCode,
                            },
                        },
                    },
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            // Step 3: Confirm on backend
            if (paymentIntent.status === 'Succeeded') {
                await confirmPayment(paymentIntent.id, orderId);
                return {
                    success: true,
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                };
            }

            return {
                success: false,
                status: paymentIntent.status,
                message: 'Payment not completed',
            };

        } catch (error) {
            console.error('Payment error:', error);
            return {
                success: false,
                message: error.message || 'Payment failed',
            };
        } finally {
            setLoading(false);
        }
    }, [stripe]);

    /**
     * Process Apple Pay payment
     */
    const processApplePay = useCallback(async (amount, orderId, items = []) => {
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        if (Platform.OS !== 'ios') {
            throw new Error('Apple Pay is only available on iOS');
        }

        setLoading(true);
        try {
            // Check if Apple Pay is available
            const { error: applePayError } = await stripe.isApplePaySupported();
            if (applePayError) {
                throw new Error('Apple Pay is not supported on this device');
            }

            // Create payment intent
            const intentResult = await createPaymentIntent({
                amount,
                currency: STRIPE_CONFIG.CURRENCY,
                orderId,
            });

            if (!intentResult.success) {
                throw new Error(intentResult.message);
            }

            // Present Apple Pay sheet
            const { error, paymentIntent } = await stripe.confirmApplePayPayment(
                intentResult.clientSecret
            );

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'Succeeded') {
                await confirmPayment(paymentIntent.id, orderId);
                return { success: true, paymentIntentId: paymentIntent.id };
            }

            return { success: false, message: 'Payment not completed' };

        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, [stripe]);

    /**
     * Process Google Pay payment
     */
    const processGooglePay = useCallback(async (amount, orderId) => {
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        if (Platform.OS !== 'android') {
            throw new Error('Google Pay is only available on Android');
        }

        setLoading(true);
        try {
            // Check if Google Pay is available
            const { error: googlePayError } = await stripe.isGooglePaySupported({
                testEnv: STRIPE_CONFIG.GOOGLE_PAY.testEnv,
            });

            if (googlePayError) {
                throw new Error('Google Pay is not supported on this device');
            }

            // Create payment intent
            const intentResult = await createPaymentIntent({
                amount,
                currency: STRIPE_CONFIG.CURRENCY,
                orderId,
            });

            if (!intentResult.success) {
                throw new Error(intentResult.message);
            }

            // Initialize Google Pay
            const { error: initError } = await stripe.initGooglePay({
                testEnv: STRIPE_CONFIG.GOOGLE_PAY.testEnv,
                merchantName: STRIPE_CONFIG.MERCHANT_NAME,
                countryCode: STRIPE_CONFIG.MERCHANT_COUNTRY_CODE,
            });

            if (initError) {
                throw new Error(initError.message);
            }

            // Present Google Pay sheet
            const { error, paymentIntent } = await stripe.presentGooglePay({
                clientSecret: intentResult.clientSecret,
                forSetupIntent: false,
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'Succeeded') {
                await confirmPayment(paymentIntent.id, orderId);
                return { success: true, paymentIntentId: paymentIntent.id };
            }

            return { success: false, message: 'Payment not completed' };

        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, [stripe]);

    const value = {
        loading,
        cardComplete,
        setCardComplete,
        processCardPayment,
        processApplePay,
        processGooglePay,
        stripe,
    };

    return (
        <StripeContext.Provider value={value}>
            {children}
        </StripeContext.Provider>
    );
}

/**
 * Hook to use Stripe payment context
 */
export function useStripePayment() {
    const context = useContext(StripeContext);
    if (!context) {
        throw new Error('useStripePayment must be used within StripePaymentProvider');
    }
    return context;
}

/**
 * Stripe Card Input Component
 */
export function StripeCardInput({ onCardChange, style }) {
    const { setCardComplete } = useStripePayment();

    const handleCardChange = (details) => {
        setCardComplete(details.complete);
        if (onCardChange) {
            onCardChange(details);
        }
    };

    return (
        <CardField
            postalCodeEnabled={false}
            placeholders={{
                number: '4242 4242 4242 4242',
            }}
            cardStyle={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                textColor: '#FFFFFF',
                borderRadius: 12,
                fontSize: 16,
                placeholderColor: 'rgba(255,255,255,0.5)',
            }}
            style={[
                {
                    width: '100%',
                    height: 50,
                    marginVertical: 10,
                },
                style,
            ]}
            onCardChange={handleCardChange}
        />
    );
}

export default {
    StripePaymentProvider,
    useStripePayment,
    StripeCardInput,
};
