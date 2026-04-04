import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import PaymentModal from '../components/ui/PaymentModal';

const PaymentContext = createContext();

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
};

export const PaymentProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);

    const triggerPayment = useCallback((details) => {
        setPaymentDetails(details);
        setIsOpen(true);
    }, []);

    const closePayment = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        // Set up the interceptor to catch 402 globally
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 402) {
                    const detail = error.response.data.detail;
                    const details = typeof detail === 'string'
                        ? { message: detail }
                        : detail;
                    triggerPayment(details);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [triggerPayment]);

    return (
        <PaymentContext.Provider value={{ triggerPayment, closePayment }}>
            {children}
            <PaymentModal
                isOpen={isOpen}
                onClose={closePayment}
                checkoutUrl={paymentDetails?.checkout_url}
                message={paymentDetails?.message}
            />
        </PaymentContext.Provider>
    );
};
