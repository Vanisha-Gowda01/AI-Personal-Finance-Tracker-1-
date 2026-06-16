from transformers import pipeline

print("Starting...")

classifier = pipeline(
    "zero-shot-classification",
    model="valhalla/distilbart-mnli-12-1"
)

print("Loaded successfully!")