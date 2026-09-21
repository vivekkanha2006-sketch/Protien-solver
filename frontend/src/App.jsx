import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdb")) {
      setError("Please upload a .pdb protein structure file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const analyzeProtein = async () => {
    if (!file) {
      setError("Please upload a PDB file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const response = await fetch(
  `${API_BASE_URL}/api/analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        "Could not connect to the FastAPI backend. Make sure it is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // CREATE AMINO ACID COMPOSITION DATA
  // -----------------------------------------

  const getCompositionData = () => {
    if (!result) return [];

    const counts = {};

    result.sequence.split("").forEach((aa) => {
      counts[aa] = (counts[aa] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([aminoAcid, count]) => ({
        aminoAcid,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // -----------------------------------------
  // CREATE COORDINATE GRAPH DATA
  // -----------------------------------------

  const getCoordinateData = () => {
    if (!result) return [];

    return result.nodes.map((node, index) => ({
      residue: index + 1,
      x: Number(node.x.toFixed(2)),
      y: Number(node.y.toFixed(2)),
      z: Number(node.z.toFixed(2)),
    }));
  };

  const compositionData = getCompositionData();
  const coordinateData = getCoordinateData();

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="hero">
        <div className="badge">
          🧬 PROTEIN ANALYSIS
        </div>

        <h1>ProteinSolver</h1>

        <p>
          Upload a protein structure and analyze its
          amino-acid sequence, structure and molecular
          information.
        </p>
      </header>

      <main className="container">

        {/* ================= UPLOAD ================= */}

        <section className="upload-card">

          <h2>Upload Protein Structure</h2>

          <p className="subtitle">
            Upload a PDB file to begin structural analysis.
          </p>

          <label className="upload-box">

            <input
              type="file"
              accept=".pdb"
              onChange={handleFileChange}
            />

            <div className="upload-icon">
              📁
            </div>

            {file ? (
              <>
                <h3>{file.name}</h3>
                <p>Protein structure selected</p>
              </>
            ) : (
              <>
                <h3>Choose a PDB file</h3>
                <p>
                  Click here to browse your computer
                </p>
              </>
            )}

          </label>

          <button
            className="analyze-button"
            onClick={analyzeProtein}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "🔬 Analyze Protein"}
          </button>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </section>


        {/* ================= RESULTS ================= */}

        {result && (

          <section className="results">

            <div className="results-header">

              <div>

                <div className="badge">
                  ANALYSIS COMPLETE
                </div>

                <h2>
                  Protein Analysis Results
                </h2>

              </div>

              <div className="file-name">
                {result.filename}
              </div>

            </div>


            {/* ================= STATISTICS ================= */}

            <div className="stats-grid">

              <div className="stat-card">
                <span>🧬</span>
                <p>Chain</p>
                <strong>
                  {result.chain}
                </strong>
              </div>

              <div className="stat-card">
                <span>🔢</span>
                <p>Residues</p>
                <strong>
                  {result.length}
                </strong>
              </div>

              <div className="stat-card">
                <span>🧪</span>
                <p>Amino Acids</p>
                <strong>
                  {result.sequence.length}
                </strong>
              </div>

              <div className="stat-card">
                <span>🔗</span>
                <p>Connections</p>
                <strong>
                  {result.edges.length}
                </strong>
              </div>

            </div>


            {/* ================= SEQUENCE ================= */}

            <div className="result-card">

              <h3>
                🧬 Amino Acid Sequence
              </h3>

              <div className="sequence">
                {result.sequence}
              </div>

              <p className="sequence-info">
                {result.sequence.length} amino acids identified
              </p>

            </div>


            {/* ================= AMINO ACID GRAPH ================= */}

            <div className="result-card">

              <h3>
                📊 Amino Acid Composition
              </h3>

              <p className="graph-description">
                Distribution of amino acids present in
                the uploaded protein sequence.
              </p>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={420}
                >

                  <BarChart
                    data={compositionData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 10,
                      bottom: 20,
                    }}
                  >

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="aminoAcid"
                      label={{
                        value: "Amino Acid",
                        position: "insideBottom",
                        offset: -10,
                      }}
                    />

                    <YAxis
                      label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="count"
                      name="Residue Count"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* ================= COORDINATE GRAPH ================= */}

            <div className="result-card">

              <h3>
                📈 Residue Coordinate Analysis
              </h3>

              <p className="graph-description">
                Cα atom coordinates across the protein
                sequence.
              </p>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={420}
                >

                  <LineChart
                    data={coordinateData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 10,
                      bottom: 20,
                    }}
                  >

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="residue"
                      label={{
                        value: "Residue Number",
                        position: "insideBottom",
                        offset: -10,
                      }}
                    />

                    <YAxis
                      label={{
                        value: "Coordinate (Å)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="x"
                      name="X Coordinate"
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="y"
                      name="Y Coordinate"
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="z"
                      name="Z Coordinate"
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* ================= STRUCTURAL INFO ================= */}

            <div className="result-card">

              <h3>
                🔗 Structural Connectivity
              </h3>

              <p>
                Residues are connected when their Cα
                atoms are within an 8 Å distance threshold.
              </p>

              <div className="structure-info">

                <div>
                  <strong>
                    {result.nodes.length}
                  </strong>

                  <span>
                    Residue Nodes
                  </span>
                </div>

                <div>
                  <strong>
                    {result.edges.length}
                  </strong>

                  <span>
                    Connections
                  </span>
                </div>

                <div>
                  <strong>
                    8 Å
                  </strong>

                  <span>
                    Distance Threshold
                  </span>
                </div>

              </div>

            </div>


            {/* ================= COORDINATE TABLE ================= */}

            <div className="result-card">

              <h3>
                📍 Residue Coordinates
              </h3>

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>#</th>
                      <th>Amino Acid</th>
                      <th>X</th>
                      <th>Y</th>
                      <th>Z</th>
                    </tr>

                  </thead>

                  <tbody>

                    {result.nodes
                      .slice(0, 20)
                      .map((node) => (

                        <tr key={node.id}>

                          <td>
                            {node.id + 1}
                          </td>

                          <td>
                            {node.aa}
                          </td>

                          <td>
                            {node.x.toFixed(2)}
                          </td>

                          <td>
                            {node.y.toFixed(2)}
                          </td>

                          <td>
                            {node.z.toFixed(2)}
                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

              {result.nodes.length > 20 && (
                <p className="table-note">
                  Showing first 20 residues of{" "}
                  {result.nodes.length}.
                </p>
              )}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;