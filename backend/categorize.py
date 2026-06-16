from backend.categorizer import get_category


transactions = [
    "Swiggy Order",
    "Uber Ride",
    "Amazon Shopping",
    "Salary Credit",
    "Electricity Bill",
]


for transaction in transactions:
    print(f"{transaction} --> {get_category(transaction)}")
