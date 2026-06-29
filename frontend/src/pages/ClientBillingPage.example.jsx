import React from 'react';
import BillingCalendar from '../components/BillingCalendar';

export default function ClientBillingPage() {
  const handleAcceptPayment = async ({ dates, total }) => {
    console.log("Accepting payment for dates:", dates, "Total:", total);
    
    // Example POST request
    try {
      /*
      const response = await fetch('/api/payments/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates, total })
      });
      if (!response.ok) throw new Error('Payment failed');
      const data = await response.json();
      console.log('Payment successful:', data);
      */
    } catch (error) {
      console.error('Error accepting payment:', error);
    }
  };

  return (
    <div style={{ padding: '40px', background: '#f3f4f6', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px', fontFamily: 'sans-serif', color: '#111827' }}>
        Client Billing
      </h1>
      
      {/* 
        Using the BillingCalendar component.
        We let it auto-generate billsByDate for the demo,
        but you could pass: billsByDate={{ "2026-06-15": 200, ... }}
      */}
      <BillingCalendar 
        onAcceptPayment={handleAcceptPayment}
      />
    </div>
  );
}
