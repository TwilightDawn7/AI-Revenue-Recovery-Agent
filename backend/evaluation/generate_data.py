"""
Synthetic Benchmark Dataset Generator (Phase 9)
Generates 100-case development and 1,000-case production benchmark datasets
with deterministic seeds and balanced failure distributions.
"""

import os
import json
import random

def generate_dataset(num_cases: int = 1000, seed: int = 42, filename: str = "test_cases_1000.json") -> str:
    random.seed(seed)
    cases = []
    
    first_names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Neha", "Rohan", "Anjali", "Karan", "Pooja", "Arjun", "Deepika", "Suresh", "Kavita", "Aditya", "Ritu"]
    last_names = ["Kumar", "Sharma", "Singh", "Patel", "Verma", "Gupta", "Joshi", "Mehta", "Nair", "Reddy", "Iyer", "Choudhury", "Bose", "Menon", "Malhotra"]
    
    for i in range(1, num_cases + 1):
        payment_id = f"pay_bench_{10000 + i}"
        customer_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        customer_email = f"{customer_name.lower().replace(' ', '.')}@example.com"
        
        r = random.random()
        if r < 0.35:
            # 1. Temporary bank/network failures (35%)
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS", "NETWORK_ERROR", "TEMPORARY_ISSUER_FAILURE"])
            subscription_status = "active"
            amount = random.choice([499.0, 999.0, 1499.0, 1999.0, 3499.0, 4999.0, 7999.0])
            past_successes = random.randint(1, 14)
            retry_count = 0
        elif r < 0.55:
            # 2. Expired card credentials / CVV issues (20%)
            failure_reason = random.choice(["EXPIRED_CARD", "INVALID_CARD_DETAILS", "INVALID_CVV", "EXPIRED_PAYMENT_METHOD"])
            subscription_status = "active"
            amount = random.choice([999.0, 1999.0, 2999.0, 5999.0, 8999.0])
            past_successes = random.randint(0, 6)
            retry_count = 0
        elif r < 0.70:
            # 3. Cancelled / halted subscriptions (15%)
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS", "EXPIRED_CARD"])
            subscription_status = "cancelled"
            amount = random.choice([1499.0, 1999.0, 2999.0, 4999.0])
            past_successes = random.randint(0, 10)
            retry_count = 0
        elif r < 0.85:
            # 4. High-value transactions > ₹25,000 (15%)
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS", "TEMPORARY_ISSUER_FAILURE"])
            subscription_status = "active"
            amount = round(random.uniform(26000.0, 95000.0), 2)
            past_successes = random.randint(1, 20)
            retry_count = 0
        else:
            # 5. Repeat / exhausted retries (15%)
            failure_reason = random.choice(["BANK_DECLINE", "INSUFFICIENT_FUNDS"])
            subscription_status = "active"
            amount = random.choice([999.0, 1999.0, 4999.0])
            past_successes = random.randint(0, 4)
            retry_count = random.choice([1, 2, 3])

        case = {
            "case_id": i,
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

    dir_path = os.path.dirname(__file__)
    os.makedirs(dir_path, exist_ok=True)
    out_path = os.path.join(dir_path, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cases, f, indent=2)
        
    print(f"Generated {len(cases)} benchmark scenarios in {out_path}")
    return out_path

def generate_all_datasets():
    generate_dataset(num_cases=100, seed=42, filename="test_cases_100.json")
    # Also save as test_cases.json for backward compatibility
    generate_dataset(num_cases=100, seed=42, filename="test_cases.json")
    generate_dataset(num_cases=1000, seed=42, filename="test_cases_1000.json")

if __name__ == "__main__":
    generate_all_datasets()
