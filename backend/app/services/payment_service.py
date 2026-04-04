from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel
import requests


class Customization(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None


class MetaInvoice(BaseModel):
    key: str
    value: str


class Meta(BaseModel):
    invoices: Optional[List[MetaInvoice]] = None


class TransactionData(BaseModel):
    checkout_url: Optional[str] = None
    tx_ref: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    charge: Optional[float] = None
    mode: Optional[str] = None
    method: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    reference: Optional[str] = None
    customization: Optional[Customization] = None
    meta: Optional[Meta] = None


class PaymentResponse(BaseModel):
    message: str
    status: str
    data: Optional[TransactionData] = None


class PaymentService:
    def __init__(self, chapa_api_key):
        self.chapa_api_key = chapa_api_key
        self.headers = {
            'Authorization': f'Bearer {chapa_api_key}',
            'Content-Type': 'application/json'
        }

    def accept_payment(
            self,
            *,
            amount: float,
            currency: Literal['ETB', 'USD'] = 'ETB',
            email: str = None,
            first_name: str = None,
            last_name: str = None,
            phone_number: str = None,
            tx_ref: str,
            callback_url: str,
            return_url: str = None,
            title: str = None,
            description: str = None
    ) -> PaymentResponse:
        """
        Initialize a payment transaction with Chapa API.
        
        Args:
            amount: Payment amount
            currency: Currency (ETB or USD)
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            phone_number: Customer phone number
            tx_ref: Transaction reference
            callback_url: Callback URL for payment updates
            return_url: Return URL after payment completion
            title: Payment title
            description: Payment description
            
        Returns:
            PaymentResponse: Structured response with message, status, and data
        """
        url = 'https://api.chapa.co/v1/transaction/initialize'
        payload = {
            "amount": amount,
            "currency": currency,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": phone_number,
            "tx_ref": tx_ref,
            "callback_url": callback_url,
            "return_url": return_url,
            "customization": {
                "title": title,
                "description": description
            }
        }

        response = requests.post(url=url, json=payload, headers=self.headers)
        response_data = response.json()
        
        # Parse the data section if it exists
        data = None
        if response_data.get("data"):
            data = TransactionData(**response_data["data"])
        
        p_response = PaymentResponse(
            message=response_data.get("message", ""),
            status=response_data.get("status", ""),
            data=data
        )
        print('\n'*5, p_response, '\n'*5)
        return p_response
    
    def cancel_transaction(self, tx_ref: str) -> PaymentResponse:
        """
        Cancel a payment transaction with Chapa API.
        
        Args:
            tx_ref: Transaction reference to cancel
            
        Returns:
            PaymentResponse: Structured response with message, status, and data
        """
        url = f'https://api.chapa.co/v1/transaction/cancel/{tx_ref}'
        
        response = requests.put(url=url, headers=self.headers)
        response_data = response.json()
        
        # Parse the data section if it exists
        data = None
        if response_data.get("data"):
            data = TransactionData(**response_data["data"])
        
        p_response = PaymentResponse(
            message=response_data.get("message", ""),
            status=response_data.get("status", ""),
            data=data
        )
        print('\n'*5, p_response, '\n'*5)
        return p_response

    def verify_payment(self, tx_ref: str) -> PaymentResponse:
        """
        Verify a payment transaction with Chapa API.
        
        Args:
            tx_ref: Transaction reference to verify
            
        Returns:
            PaymentResponse: Structured response with message, status, and data
        """
        url = f'https://api.chapa.co/v1/transaction/verify/{tx_ref}'
        
        response = requests.get(url=url, headers=self.headers)
        response_data = response.json()
        
        # Parse the data section if it exists
        data = None
        if response_data.get("data"):
            data = TransactionData(**response_data["data"])
        
        p_response = PaymentResponse(
            message=response_data.get("message", ""),
            status=response_data.get("status", ""),
            data=data
        )
        print('\n'*5, p_response, '\n'*5)
        return p_response

    def receipt_url(self, reference_id: str):
        p_response = f'https://chapa.link/payment-receipt/{reference_id}'
        print('\n'*5, p_response, '\n'*5)
        return p_response
