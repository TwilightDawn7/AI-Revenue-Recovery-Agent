import os
import json
import random

def generate_test_dataset():
    """
    Generates a reproducible dataset of 100 high-quality synthetic payment failure cases.
    Contains customer payment history, subscription status, amount, and decline reasons.
    """
    random.seed(42)  # For reproducibility
    
    cases = []
    
    # Define failure distribution classes
    failure_reasons = ["BANK_DECLINE", "INSUFFICIENT_FUNDS", "EXPIRED_CARD", "INVALID_CARD_DETAILS", "NETWORK_ERROR"]
    subscription_statuses = ["active", "cancelled"]
    
    first_names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Neha", "Rohan", "Anjali", "Karan", "Pooja"]
    last_names = ["Kumar", "Sharma", "Singh", "Patel", "Verma", "Gupta", "Joshi", "Mehta", "Nair", "Reddy"]
    
    for i in range(1, 101):
        payment_id = f"pay_test_{1000 + i}"
        customer_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        customer_email = f"{customer_name.lower().replace(' ', '.')}@example.com"
        
        # Decide category to ensure structured distribution
        r = random.random()
        
        if r < 0.40:
            # 1. Temporary bank declines (40%)
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS", "NETWORK_ERROR"])
            subscription_status = "active"
            amount = random.choice([499.0, 999.0, 1999.0, 4999.0])
            past_successes = random.randint(1, 12)
            retry_count = 0
        elif r < 0.60:
            # 2. Expired card details (20%)
            failure_reason = random.choice(["EXPIRED_CARD", "INVALID_CARD_DETAILS"])
            subscription_status = "active"
            amount = random.choice([999.0, 2999.0, 5999.0])
            past_successes = random.randint(0, 5)
            retry_count = 0
        elif r < 0.75:
            # 3. Cancelled subscriptions (15%) - Should stop immediately
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS", "EXPIRED_CARD"])
            subscription_status = "cancelled"
            amount = random.choice([1999.0, 3999.0])
            past_successes = random.randint(0, 10)
            retry_count = 0
        elif r < 0.85:
            # 4. High-value payments > 25,000 (10%) - Should escalate
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS"])
            subscription_status = "active"
            amount = random.uniform(26000.0, 75000.0)
            past_successes = random.randint(1, 15)
            retry_count = 0
        else:
            # 5. Already retried or repeat failures (15%)
            failure_reason = "BANK_DECLINE"
            subscription_status = "active"
            amount = random.choice([999.0, 1999.0])
            past_successes = random.randint(0, 3)
            retry_count = random.randint(1, 2)  # Some already retried

        case = {
            "payment_id": payment_id,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "amount": round(amount, 2),
            "currency": "INR",
            "problem_type": "SUBSCRIPTION_PAYMENT_FAILED",
            "failure_reason": failure_reason,
            "subscription_status": subscription_status,
            "previous_successful_payments": past_successes,
            "previous_failed_payments": retry_count,
            "retry_count": retry_count
        }
        cases.append(case)

    # Ensure evaluation folder exists
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), "test_cases.json")
    with open(out_path, "w") as f:
        json.dump(cases, f, indent=2)
        
    print(f"Generated {len(cases)} test cases in {out_path}")

if __name__ == "__main__":
    generate_test_dataset()
