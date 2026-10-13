from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Citas API ", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "root"),
        database=os.getenv("DB_NAME", "citas_db")
    )


def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS respuestas (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                plan       VARCHAR(150) NOT NULL,
                fecha      DATE NOT NULL,
                creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print(" Tabla 'respuestas' lista en MySQL")
    except Exception as e:
        print(f" Error al conectar con MySQL: {e}")

init_db()


class Cita(BaseModel):
    plan: str
    fecha: str   # formato YYYY-MM-DD



@app.get("/")
def raiz():
    return FileResponse("ola.html")

@app.post("/api/guardar-cita")
def guardar_cita(cita: Cita):
    """Guarda el plan y la fecha seleccionados en la base de datos."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO respuestas (plan, fecha) VALUES (%s, %s)",
            (cita.plan, cita.fecha)
        )
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {
            "ok": True,
            "id": nuevo_id,
            "mensaje": f"¡Cita guardada! Plan: {cita.plan} | Fecha: {cita.fecha} "
        }
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Error MySQL: {e.msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/citas")
def ver_citas():
    """Devuelve todas las citas guardadas, de más nueva a más antigua."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM respuestas ORDER BY creado_en DESC")
        citas = cursor.fetchall()
        cursor.close()
        conn.close()
      
        for c in citas:
            if c.get("fecha"):
                c["fecha"] = str(c["fecha"])
            if c.get("creado_en"):
                c["creado_en"] = str(c["creado_en"])
        return citas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/citas/{cita_id}")
def eliminar_cita(cita_id: int):
    """Elimina una cita por su ID."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM respuestas WHERE id = %s", (cita_id,))
        conn.commit()
        eliminadas = cursor.rowcount
        cursor.close()
        conn.close()
        if eliminadas == 0:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        return {"ok": True, "mensaje": f"Cita {cita_id} eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.mount("/", StaticFiles(directory=".", html=True), name="static")