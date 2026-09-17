from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from Bio.PDB import PDBParser
from Bio.SeqUtils import seq1
import tempfile
import os
import math

# Create FastAPI application
app = FastAPI(title="ProteinSolver API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://protien-solver-zl5a.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "ProteinSolver API is running"
    }


@app.post("/api/analyze")
async def analyze_protein(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdb"):
        return {
            "error": "Please upload a PDB file."
        }

    contents = await file.read()

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdb"
        ) as temp:

            temp.write(contents)
            temp_path = temp.name

        # Read PDB structure
        parser = PDBParser(QUIET=True)
        structure = parser.get_structure(
            "protein",
            temp_path
        )

        model = next(structure.get_models())

        chains = list(model.get_chains())

        if not chains:
            return {
                "error": "No protein chains found."
            }

        chain = chains[0]

        residues = []

        # Extract amino acids and coordinates
        for residue in chain:

            if residue.id[0] == " " and "CA" in residue:

                try:
                    aa = seq1(residue.resname)
                except Exception:
                    aa = "X"

                coord = residue["CA"].coord

                residues.append({
                    "aa": aa,
                    "x": float(coord[0]),
                    "y": float(coord[1]),
                    "z": float(coord[2]),
                })

        sequence = "".join(
            residue["aa"] for residue in residues
        )

        # Create graph nodes
        nodes = []

        for i, residue in enumerate(residues):

            nodes.append({
                "id": i,
                "aa": residue["aa"],
                "x": residue["x"],
                "y": residue["y"],
                "z": residue["z"],
            })

        # Create graph edges based on distance
        edges = []

        threshold = 8.0

        for i in range(len(residues)):

            for j in range(i + 1, len(residues)):

                dx = residues[i]["x"] - residues[j]["x"]
                dy = residues[i]["y"] - residues[j]["y"]
                dz = residues[i]["z"] - residues[j]["z"]

                distance = math.sqrt(
                    dx * dx +
                    dy * dy +
                    dz * dz
                )

                if distance <= threshold:

                    edges.append({
                        "source": i,
                        "target": j,
                        "distance": round(distance, 3)
                    })

        return {
            "filename": file.filename,
            "chain": chain.id,
            "length": len(residues),
            "sequence": sequence,
            "nodes": nodes,
            "edges": edges,
        }

    except Exception as e:

        return {
            "error": str(e)
        }

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)