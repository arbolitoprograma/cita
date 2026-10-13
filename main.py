from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

app = FastAPI(title="Citas API ", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Cita(BaseModel):
    plan: str
    fecha: str   # formato YYYY-MM-DD


@app.get("/")
def raiz():
    return FileResponse("ola.html")


@app.post("/api/guardar-cita")
def guardar_cita(cita: Cita):
    try:
        res = supabase.table("respuestas").insert(
            {"plan": cita.plan, "fecha": cita.fecha}
        ).execute()
        return {
            "ok": True,
            "id": res.data[0]["id"],
            "mensaje": f"¡Cita guardada! Plan: {cita.plan} | Fecha: {cita.fecha}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/citas")
def ver_citas():
    try:
        res = supabase.table("respuestas").select("*").order(
            "creado_en", desc=True
        ).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/citas/{cita_id}")
def eliminar_cita(cita_id: int):
    try:
        res = supabase.table("respuestas").delete().eq("id", cita_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        return {"ok": True, "mensaje": f"Cita {cita_id} eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.mount("/", StaticFiles(directory=".", html=True), name="static")