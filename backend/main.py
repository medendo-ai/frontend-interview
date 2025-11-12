from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import json
import os

load_dotenv()

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")

app = FastAPI()

class SummarizeRequest(BaseModel):
    transcript: str

@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
    }
    prompt = f"Please summarize the following content:\n\n{req.transcript}"
    data = {
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(API_URL, headers=headers, json=data)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()["choices"][0]["message"]["content"].strip()
