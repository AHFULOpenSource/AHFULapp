//@Author Jonathan Torrence
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./MeasurementLogger.css";
import "../siteStyles.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = "https://www.ahful.app/api/AHFULmeasurements";

export function MeasurementLogger() {
    const user = useSelector((state) => state.auth.user);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMetric, setIsMetric] = useState(false);
    const [formData, setFormData] = useState({
        chest: "",
        waist: "",
        hips: "",
        thighs: "",
        arms: "",
        weight: "",
        date: new Date().toISOString().split('T')[0]
    });
    const [errors, setErrors] = useState("");
    const [editingId, setEditingId] = useState(null);

    const getUserId = () => {
        if (user?._id) return user._id;
        try {
            const stored = JSON.parse(localStorage.getItem("user_data"));
            return stored?._id || null;
        } catch {
            return null;
        }
    };

    const userId = getUserId();

    // Conversion functions
    const inchesToCm = (inches) => inches ? (inches * 2.54).toFixed(1) : "";
    const cmToInches = (cm) => cm ? (cm / 2.54).toFixed(1) : "";
    const lbsToKg = (lbs) => lbs ? (lbs * 0.453592).toFixed(1) : "";
    const kgToLbs = (kg) => kg ? (kg / 0.453592).toFixed(1) : "";

    const measurements_to_track = [
        {key: "chest", labelImperial: "Chest (inches)", labelMetric: "Chest (cm)"},
        {key: "waist", labelImperial: "Waist (inches)", labelMetric: "Waist (cm)"},
        {key: "hips", labelImperial: "Hips (inches)", labelMetric: "Hips (cm)"},
        {key: "thighs", labelImperial: "Thighs (inches)", labelMetric: "Thighs (cm)"},
        {key: "arms", labelImperial: "Arms (inches)", labelMetric: "Arms (cm)"},
        {key: "weight", labelImperial: "Weight (lbs)", labelMetric: "Weight (kg)"}
    ];

    const getLabel = (measurement) => isMetric ? measurement.labelMetric : measurement.labelImperial;

    // Load measurements on component mount
    useEffect(() => {
        fetchMeasurements();
    }, [userId]);

    const fetchMeasurements = async () => {
        if (!userId) {
            setMeasurements([]);
            setErrors("Please log in to manage measurements");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/${userId}`, {credentials: "include"});

            if (response.status === 404) {
                setMeasurements([]);
                setErrors("");
                return;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to fetch measurements");
            }

            const data = await response.json();
            setMeasurements(data || []);
            setErrors("");
        } catch (error) {
            console.error("Error fetching measurements:", error);
            setErrors("Failed to load measurements");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name]: value});
    };

    const handleAddMeasurement = async (e) => {
        e.preventDefault();
        setErrors("");

        if (!userId) {
            setErrors("Please log in to save measurements");
            return;
        }

        // Basic validation
        if (!formData.date) {
            setErrors("Please select a date.");
            return;
        }


        const hasAtLeastOne = measurements_to_track.some(
        m =>
            formData[m.key] !== "" &&
            formData[m.key] !== null &&
            formData[m.key] !== undefined
        );
        if (!hasAtLeastOne) {
            setErrors("Please enter at least one measurement");
            return;
        }

        try {
            setLoading(true);

            // Convert metric to imperial if needed (backend stores everything in imperial)
            const convertedFormData = { ...formData };
            if (isMetric) {
                // Convert dimensions from cm to inches
                if (formData.chest) convertedFormData.chest = parseFloat(cmToInches(formData.chest));
                if (formData.waist) convertedFormData.waist = parseFloat(cmToInches(formData.waist));
                if (formData.hips) convertedFormData.hips = parseFloat(cmToInches(formData.hips));
                if (formData.thighs) convertedFormData.thighs = parseFloat(cmToInches(formData.thighs));
                if (formData.arms) convertedFormData.arms = parseFloat(cmToInches(formData.arms));
                // Convert weight from kg to lbs
                if (formData.weight) convertedFormData.weight = parseFloat(kgToLbs(formData.weight));
            }

            const payload = {
                user_id: userId,
                ...convertedFormData,
                date: Math.floor(new Date(formData.date).getTime() / 1000)
            };

            const endpoint = editingId
                ? `${API_BASE}/update/${editingId}`
                : `${API_BASE}/create`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save measurement");
            }

            // Refresh measurements
            await fetchMeasurements();

            // Reset form
            setFormData({
                chest: "",
                waist: "",
                hips: "",
                thighs: "",
                arms: "",
                weight: "",
                date: new Date().toISOString().split('T')[0]
            });
            setEditingId(null);
            setErrors("");
        } catch (error) {
            console.error("Error saving measurement:", error);
            setErrors("Failed to save measurement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMeasurement = (measurement) => {
        // Convert imperial values to metric if in metric mode
        const displayChest = isMetric && measurement.chest ? parseFloat(inchesToCm(measurement.chest)) : measurement.chest ?? "";
        const displayWaist = isMetric && measurement.waist ? parseFloat(inchesToCm(measurement.waist)) : measurement.waist ?? "";
        const displayHips = isMetric && measurement.hips ? parseFloat(inchesToCm(measurement.hips)) : measurement.hips ?? "";
        const displayThighs = isMetric && measurement.thighs ? parseFloat(inchesToCm(measurement.thighs)) : measurement.thighs ?? "";
        const displayArms = isMetric && measurement.arms ? parseFloat(inchesToCm(measurement.arms)) : measurement.arms ?? "";
        const displayWeight = isMetric && measurement.weight ? parseFloat(lbsToKg(measurement.weight)) : measurement.weight ?? "";

        setFormData({
            chest: displayChest.toString(),
            waist: displayWaist.toString(),
            hips: displayHips.toString(),
            thighs: displayThighs.toString(),
            arms: displayArms.toString(),
            weight: displayWeight.toString(),
            date: new Date(measurement.date * 1000).toISOString().split("T")[0]
        });
        setEditingId(measurement._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMeasurement = async (id) => {
        if (window.confirm("Are you sure you want to delete this measurement?")) {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/delete/${id}`, {
                    method: 'DELETE', credentials: "include",
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to delete measurement");
                }

                await fetchMeasurements();
            } catch (error) {
                console.error("Error deleting measurement:", error);
                setErrors("Failed to delete measurement");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            chest: "",
            waist: "",
            hips: "",
            thighs: "",
            arms: "",
            weight: "",
            date: new Date().toISOString().split('T')[0]
        });
    };

    // Prepare chart data
    const chartData = measurements
        .slice()
        .sort((a, b) => a.date - b.date)
        .map((measurement) => ({
            date: new Date(measurement.date * 1000).toLocaleDateString(),
            chest: isMetric ? (measurement.chest ? parseFloat(inchesToCm(measurement.chest)) : null) : measurement.chest ?? null,
            waist: isMetric ? (measurement.waist ? parseFloat(inchesToCm(measurement.waist)) : null) : measurement.waist ?? null,
            hips: isMetric ? (measurement.hips ? parseFloat(inchesToCm(measurement.hips)) : null) : measurement.hips ?? null,
            thighs: isMetric ? (measurement.thighs ? parseFloat(inchesToCm(measurement.thighs)) : null) : measurement.thighs ?? null,
            arms: isMetric ? (measurement.arms ? parseFloat(inchesToCm(measurement.arms)) : null) : measurement.arms ?? null,
            weight: isMetric ? (measurement.weight ? parseFloat(lbsToKg(measurement.weight)) : null) : measurement.weight ?? null
        }));

    return (
        <div className="measurement-container">
            <div className="measurement-header">
                <h1>Measurement Logger</h1>
                <div className="unit-toggle">
                    <button
                        className={`unit-btn ${!isMetric ? 'active' : ''}`}
                        onClick={() => setIsMetric(false)}
                    >
                        Imperial
                    </button>
                    <button
                        className={`unit-btn ${isMetric ? 'active' : ''}`}
                        onClick={() => setIsMetric(true)}
                    >
                        Metric
                    </button>
                </div>
            </div>

            <div className="measurement-content">
                {/* Add/Edit Measurement Form */}
                <div className="add-measurement-section">
                    <h2>{editingId ? "Edit Measurement" : "Log New Measurements"}</h2>
                    {errors && <div className="error-message">{errors}</div>}

                    <form onSubmit={handleAddMeasurement} className="measurement-form">
                        <div className="form-group">
                            <label htmlFor="date">Date</label>
                            <input
                                id="date"
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>

                        {measurements_to_track.map(measurement => (
                            <div key={measurement.key} className="form-group">
                                <label htmlFor={measurement.key}>{getLabel(measurement)}</label>
                                <input
                                    id={measurement.key}
                                    type="number"
                                    name={measurement.key}
                                    step="0.1"
                                    value={formData[measurement.key]}
                                    onChange={handleInputChange}
                                    placeholder={`Enter ${getLabel(measurement).toLowerCase()}`}
                                    disabled={loading}
                                />
                            </div>
                        ))}

                        <div className="form-buttons">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : editingId ? "Update Measurement" : "Add Measurement"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Charts Section */}
                {chartData.length > 0 && (
                    <div className="charts-section">
                        <h2>Measurement Trends</h2>

                        {/* Weight Chart */}
                        {chartData.some(d => d.weight) && (
                            <div className="chart-container">
                                <h3>Weight Progress</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="weight" stroke="#8884d8" name={isMetric ? "Weight (kg)" : "Weight (lbs)"} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Body Measurements Chart */}
                        {chartData.some(d => d.chest || d.waist || d.hips || d.arms || d.thighs) && (
                            <div className="chart-container">
                                <h3>Body Measurements Progress</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="chest" stroke="#82ca9d" name={isMetric ? "Chest (cm)" : "Chest (in)"} />
                                        <Line type="monotone" dataKey="waist" stroke="#ffc658" name={isMetric ? "Waist (cm)" : "Waist (in)"} />
                                        <Line type="monotone" dataKey="hips" stroke="#ff7c7c" name={isMetric ? "Hips (cm)" : "Hips (in)"} />
                                        <Line type="monotone" dataKey="arms" stroke="#8dd1e1" name={isMetric ? "Arms (cm)" : "Arms (in)"} />
                                        <Line type="monotone" dataKey="thighs" stroke="#d084d0" name={isMetric ? "Thighs (cm)" : "Thighs (in)"} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Measurement History */}
                <div className="measurement-history">
                    <h2>Measurement History</h2>
                    {loading && <p>Loading...</p>}
                    {measurements.length === 0 && !loading && <p>No measurements recorded yet. Add your first measurement above!</p>}

                    {measurements.length > 0 && (
                        <div className="measurements-list">
                            {measurements.slice().reverse().map(measurement => (
                                <div key={measurement._id} className="measurement-card">
                                    <div className="measurement-date">
                                        {new Date(measurement.date * 1000).toLocaleDateString()}
                                    </div>
                                    <div className="measurement-values">
                                        {measurement.weight && <p><strong>Weight:</strong> {isMetric ? lbsToKg(measurement.weight) : measurement.weight} {isMetric ? 'kg' : 'lbs'}</p>}
                                        {measurement.chest && <p><strong>Chest:</strong> {isMetric ? inchesToCm(measurement.chest) : measurement.chest} {isMetric ? 'cm' : '"'}</p>}
                                        {measurement.waist && <p><strong>Waist:</strong> {isMetric ? inchesToCm(measurement.waist) : measurement.waist} {isMetric ? 'cm' : '"'}</p>}
                                        {measurement.hips && <p><strong>Hips:</strong> {isMetric ? inchesToCm(measurement.hips) : measurement.hips} {isMetric ? 'cm' : '"'}</p>}
                                        {measurement.arms && <p><strong>Arms:</strong> {isMetric ? inchesToCm(measurement.arms) : measurement.arms} {isMetric ? 'cm' : '"'}</p>}
                                        {measurement.thighs && <p><strong>Thighs:</strong> {isMetric ? inchesToCm(measurement.thighs) : measurement.thighs} {isMetric ? 'cm' : '"'}</p>}
                                    </div>
                                    <div className="measurement-actions">
                                        <button
                                            className="btn btn-edit"
                                            onClick={() => handleEditMeasurement(measurement)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-delete"
                                            onClick={() => handleDeleteMeasurement(measurement._id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
