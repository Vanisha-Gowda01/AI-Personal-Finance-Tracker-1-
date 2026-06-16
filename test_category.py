from categorizer import get_category

transactions = [
    "Swiggy Order",
    "Uber Ride",
    "Amazon Shopping",
    "Salary Credit",
    "Electricity Bill"
]

for item in transactions:
    print(f"{item} --> {get_category(item)}")