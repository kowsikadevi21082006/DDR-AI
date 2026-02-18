import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cerebras AI
api_key = os.getenv("CEREBRAS_API_KEY")
client = None
if api_key:
    client = Cerebras(api_key=api_key)
else:
    print("Warning: CEREBRAS_API_KEY not found in environment variables.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "DDR AI API is running with Cerebras. Go to /docs to use the API."}

async def get_text_from_file(file: UploadFile):
    content = await file.read()
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return content.decode("utf-16")
        except UnicodeDecodeError:
            return content.decode("latin-1")

@app.post("/generate-ddr/")
async def generate_ddr(
    inspection: UploadFile = File(...),
    thermal: UploadFile = File(...)
):
    if not api_key:
        raise HTTPException(status_code=500, detail="Cerebras API Key not configured. Please add CEREBRAS_API_KEY to your .env file.")

    # Extract text from uploaded files
    inspection_text = await get_text_from_file(inspection)
    thermal_text = await get_text_from_file(thermal)

    prompt = f"""
    Act as a professional building diagnostic expert. Your task is to generate a Detailed Diagnostic Report (DDR) based on the following two documents.

    Document 1: Inspection Report (contains site observations and issue descriptions)
    ---
    {inspection_text}
    ---

    Document 2: Thermal Report (contains temperature readings and thermal findings)
    ---
    {thermal_text}
    ---

    Your goal is to convert this technical data into a structured, client-ready report.

    The DDR must follow this structure exactly:
    1. Property Issue Summary: A high-level, professional summary of the main concerns found.
    2. Area-wise Observations: Detailed findings organized by area (e.g., Bedroom, Kitchen, Parking). Combine information from both reports logically (e.g., matching a damp spot in the inspection with a cold spot in the thermal report). Avoid duplicate points.
    3. Probable Root Cause: Based on the evidence, what is the most likely cause of these issues?
    4. Severity Assessment (with reasoning): Rate the overall severity (Low, Medium, or High) and provide clear reasoning based on the findings.
    5. Recommended Actions: Practical, step-by-step recommendations for repair or further investigation.
    6. Additional Notes: Any other relevant professional advice or observations.
    7. Missing or Unclear Information: Explicitly list any critical information that was not found in the documents. If nothing is missing, write "None". If specific sections are missing details, write "Not Available".

    Important Rules:
    - Do NOT invent facts or figures not present in the documents.
    - If information in the two documents conflicts, mention the conflict clearly.
    - Use simple, client-friendly language. Avoid unnecessary technical jargon.
    - If information is missing for a required section, write "Not Available".
    - Focus on clarity, reasoning, and reliability.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional building diagnostic expert."},
                {"role": "user", "content": prompt}
            ],
            model="llama3.1-8b",
        )
        report_content = response.choices[0].message.content
        
        # Save output for reference (optional)
        os.makedirs("output", exist_ok=True)
        with open("output/ddr.txt", "w", encoding="utf-8") as f:
            f.write(report_content)

        return {"report": report_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
