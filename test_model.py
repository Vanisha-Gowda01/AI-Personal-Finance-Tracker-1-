from transformers import pipeline

print("Loading model...")

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

print("Model loaded!")

labels = ["Food", "Travel", "Shopping", "Bills", "Income"]

result = classifier(
    "Swiggy Order Payment",
    labels
)

print(result)
print("Category:", result["labels"][0])
