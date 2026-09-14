import csv
import json
import random
from pathlib import Path
from datetime import datetime, timedelta

def generate_synthetic_dataset():
    """
    Generates story-based forensic dataset matching MVP spec:
    - True Fraud Chain: Victim -> Mule A (₹80,000) -> Mule B (₹75,000) -> Cash-out (₹70,000)
    - Trap 1: Shared public IP between Mule B and an innocent merchant
    - Trap 2: Shared IMEI between Mule A and syndicate coordinator
    - Trap 3: Duplicate transaction entry
    - Trap 4: Heterogeneous timestamp formats (ISO vs DD/MM/YYYY)
    - Noise: Normal civilian calls and legitimate UPI payments
    """
    out_dir = Path(__file__).resolve().parent.parent / "synthetic"
    gt_dir = Path(__file__).resolve().parent.parent / "ground_truth"
    out_dir.mkdir(parents=True, exist_ok=True)
    gt_dir.mkdir(parents=True, exist_ok=True)

    base_time = datetime(2026, 9, 13, 14, 30, 0)

    # --- 1. BANK TRANSACTIONS ---
    bank_rows = []
    
    # Ground Truth Fraud Transactions
    # Hop 1: Victim -> Mule A
    bank_rows.append({
        "timestamp": base_time.strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_id": "TXN_FRAUD_001",
        "sender_account": "100001928374",
        "receiver_account": "200002837465",
        "sender_upi": "victim@okhdfcbank",
        "receiver_upi": "mule.a@paytm",
        "amount": 80000.0,
        "status": "SUCCESS",
        "sender_ip": "49.36.12.80",
    })

    # Hop 2: Mule A -> Mule B (3 mins later, alternate timestamp format)
    t_hop2 = base_time + timedelta(minutes=3)
    bank_rows.append({
        "timestamp": t_hop2.strftime("%d/%m/%Y %H:%M:%S"),  # Trap 4: format mismatch
        "transaction_id": "TXN_FRAUD_002",
        "sender_account": "200002837465",
        "receiver_account": "300003746582",
        "sender_upi": "mule.a@paytm",
        "receiver_upi": "mule.b@okaxis",
        "amount": 75000.0,
        "status": "SUCCESS",
        "sender_ip": "117.211.89.44",  # Shared IP
    })

    # Trap 3: Duplicate transaction of Hop 2
    bank_rows.append({
        "timestamp": t_hop2.strftime("%d/%m/%Y %H:%M:%S"),
        "transaction_id": "TXN_FRAUD_002",  # DUPLICATE ID
        "sender_account": "200002837465",
        "receiver_account": "300003746582",
        "sender_upi": "mule.a@paytm",
        "receiver_upi": "mule.b@okaxis",
        "amount": 75000.0,
        "status": "SUCCESS",
        "sender_ip": "117.211.89.44",
    })

    # Hop 3: Mule B -> Cash-out Endpoint (4 mins later)
    t_hop3 = t_hop2 + timedelta(minutes=4)
    bank_rows.append({
        "timestamp": t_hop3.strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_id": "TXN_FRAUD_003",
        "sender_account": "300003746582",
        "receiver_account": "400004658391",
        "sender_upi": "mule.b@okaxis",
        "receiver_upi": "cashout.pos@icici",
        "amount": 70000.0,
        "status": "SUCCESS",
        "sender_ip": "117.211.89.44",
    })

    # Trap 1: Innocent Merchant sharing same IP with Mule B
    bank_rows.append({
        "timestamp": (base_time + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
        "transaction_id": "TXN_INNOCENT_IP",
        "sender_account": "999999123456",
        "receiver_account": "888888654321",
        "sender_upi": "innocent.tea@upi",
        "receiver_upi": "milk.supplier@upi",
        "amount": 450.0,
        "status": "SUCCESS",
        "sender_ip": "117.211.89.44",  # SAME IP AS MULE B
    })

    # Background Noise Bank Transactions (~50 rows)
    random.seed(42)
    for i in range(1, 55):
        t_rand = base_time + timedelta(minutes=random.randint(-180, 180))
        s_acc = f"{random.randint(500000, 599999)}112233"
        r_acc = f"{random.randint(600000, 699999)}445566"
        bank_rows.append({
            "timestamp": t_rand.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_id": f"TXN_NOISE_{i:04d}",
            "sender_account": s_acc,
            "receiver_account": r_acc,
            "sender_upi": f"user{i}@upi",
            "receiver_upi": f"shop{i}@upi",
            "amount": round(random.uniform(50.0, 4500.0), 2),
            "status": "SUCCESS",
            "sender_ip": f"103.{random.randint(10, 99)}.{random.randint(1, 250)}.12",
        })

    # Write Bank CSV
    bank_csv_path = out_dir / "Bank_Settlement_Sheet.csv"
    with open(bank_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "timestamp", "transaction_id", "sender_account", "receiver_account",
            "sender_upi", "receiver_upi", "amount", "status", "sender_ip"
        ])
        writer.writeheader()
        writer.writerows(bank_rows)

    # --- 2. CDR TELECOM LOGS ---
    cdr_rows = []
    
    # Phishing Call to Victim prior to transfer
    cdr_rows.append({
        "timestamp": (base_time - timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S"),
        "caller": "+91 98765 00099",  # Syndicate caller
        "callee": "09876500001",       # Victim (Trap 4: format variant)
        "duration": "285",
        "imei": "864928049182741",     # Shared IMEI (Trap 2)
        "imsi": "404450192837461",
        "cell_id": "DELHI_TWR_401",
    })

    # Coordination Call between Mule A and Syndicate
    cdr_rows.append({
        "timestamp": (base_time - timedelta(minutes=2)).strftime("%d/%m/%Y %H:%M:%S"),
        "caller": "9876500002",        # Mule A
        "callee": "9876500099",        # Syndicate
        "duration": "45",
        "imei": "864928049182741",     # Shared IMEI with Syndicate (Trap 2)
        "imsi": "404450837465812",
        "cell_id": "DELHI_TWR_401",
    })

    # Mule A Call to Mule B right before Hop 2
    cdr_rows.append({
        "timestamp": (base_time + timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"),
        "caller": "9876500002",        # Mule A
        "callee": "9876500003",        # Mule B
        "duration": "60",
        "imei": "864928049182741",
        "imsi": "404450837465812",
        "cell_id": "DELHI_TWR_405",
    })

    # Call with Missing IMEI (Handled without crash)
    cdr_rows.append({
        "timestamp": (base_time + timedelta(minutes=6)).strftime("%Y-%m-%d %H:%M:%S"),
        "caller": "9876500003",        # Mule B
        "callee": "9876500004",        # Cashout contact
        "duration": "30",
        "imei": "NULL",                # Missing IMEI
        "imsi": "404450918273645",
        "cell_id": "MUMBAI_TWR_102",
    })

    # Background Noise CDR (~60 rows)
    for i in range(1, 65):
        t_rand = base_time + timedelta(minutes=random.randint(-240, 240))
        c1 = f"98765{random.randint(10000, 99999)}"
        c2 = f"98765{random.randint(10000, 99999)}"
        cdr_rows.append({
            "timestamp": t_rand.strftime("%Y-%m-%d %H:%M:%S"),
            "caller": c1,
            "callee": c2,
            "duration": str(random.randint(5, 300)),
            "imei": f"86492804{random.randint(1000000, 9999999)}" if random.random() > 0.1 else "",
            "imsi": f"404450{random.randint(100000000, 999999999)}",
            "cell_id": f"TWR_{random.randint(100, 999)}",
        })

    # Write CDR CSV
    cdr_csv_path = out_dir / "CDR_Telecom_Records.csv"
    with open(cdr_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "timestamp", "caller", "callee", "duration", "imei", "imsi", "cell_id"
        ])
        writer.writeheader()
        writer.writerows(cdr_rows)

    # --- 3. GROUND TRUTH JSON ---
    ground_truth = {
        "case_description": "₹80,000 Phishing Fraud with Multi-Hop Forwarding & Shared Device Syndicate",
        "victim": {
            "account": "ACCOUNT:100001928374",
            "phone": "PHONE:9876500001",
            "loss_amount": 80000.0,
        },
        "true_fraud_path": [
            {"from": "ACCOUNT:100001928374", "to": "ACCOUNT:200002837465", "amount": 80000.0, "role": "Victim -> Mule A"},
            {"from": "ACCOUNT:200002837465", "to": "ACCOUNT:300003746582", "amount": 75000.0, "role": "Mule A -> Mule B"},
            {"from": "ACCOUNT:300003746582", "to": "ACCOUNT:400004658391", "amount": 70000.0, "role": "Mule B -> Cashout"},
        ],
        "prime_mules": ["ACCOUNT:200002837465", "ACCOUNT:300003746582"],
        "shared_device": "IMEI:864928049182741",
        "traps": {
            "shared_ip": {
                "ip": "IP:117.211.89.44",
                "innocent_account": "ACCOUNT:999999123456",
                "expected": "Weak association, penalize confidence, do not flag innocent account as mule",
            },
            "duplicate_tx": {
                "tx_id": "TXN_FRAUD_002",
                "expected": "Deduplicated to 1 valid transaction",
            }
        }
    }

    with open(gt_dir / "ground_truth.json", "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Generated {len(bank_rows)} bank rows and {len(cdr_rows)} CDR rows.")
    print(f"Files written to {out_dir}")

if __name__ == "__main__":
    generate_synthetic_dataset()
