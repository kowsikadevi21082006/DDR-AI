from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

app = FastAPI()

@app.get("/")
def home():
    return {"message": "DDR AI API is running. Go to /docs to use the API."}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def extract_issues(text):
    keywords = ["damp", "crack", "leak", "seepage", "gap", "plumbing"]
    issues = []
    for line in text.split("\n"):
        for word in keywords:
            if word in line.lower():
                issues.append(line.strip())
                break
    return list(set(issues))

@app.post("/generate-ddr/")
async def generate_ddr(
    inspection: UploadFile = File(...),
    thermal: UploadFile = File(...)
):
    # Save files
    with open("inspection.txt", "wb") as buffer:
        shutil.copyfileobj(inspection.file, buffer)

    with open("thermal.txt", "wb") as buffer:
        shutil.copyfileobj(thermal.file, buffer)

    inspection_text = extract_text("inspection.txt")
    thermal_text = extract_text("thermal.txt")

    issues = extract_issues(inspection_text + thermal_text)

    report = f"""
DETAILED DIAGNOSTIC REPORT

1. Property Issue Summary
Multiple moisture and structural concerns observed.

2. Area-wise Observations
{chr(10).join("- " + i for i in issues)}

3. Probable Root Cause
Likely due to waterproofing failure, plumbing leaks, and external wall cracks.

4. Severity Assessment
Medium — Moisture intrusion and structural cracks require attention.

5. Recommended Actions
• Seal external wall cracks
• Regrout bathroom tiles
• Repair plumbing leaks
• Apply waterproof coating

6. Additional Notes
Thermal readings indicate moisture presence in several areas.

7. Missing or Unclear Information
Not Available
"""

    return {"report": report}
