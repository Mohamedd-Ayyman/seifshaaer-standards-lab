"use client";
import React, { useState } from "react";
import {
  Activity,
  Droplets,
  Wind,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  TestTube,
} from "lucide-react";

const BloodGasAnalyzer = () => {
  const [patientAge, setPatientAge] = useState(45);
  const [sampleType, setSampleType] = useState("arterial");
  const [phValues, setPhValues] = useState("7.40, 7.38, 7.42, 7.39");
  const [pao2Values, setPao2Values] = useState("95, 98, 92, 96");
  const [paco2Values, setPaco2Values] = useState("40, 38, 42, 39");
  const [hco3Values, setHco3Values] = useState("24, 23, 25, 24");
  const [baseExcessValues, setBaseExcessValues] = useState("0, -1, 1, 0");
  const [lactateValues, setLactateValues] = useState("1.2, 1.5, 1.3, 1.4");
  const [analysis, setAnalysis] = useState(null);

  const getNormalRanges = (sampleType) => {
    return {
      pH: [7.35, 7.45],
      PaO2: sampleType === "arterial" ? [80, 100] : [35, 45],
      PaCO2: [35, 45],
      HCO3: [22, 26],
      base_excess: [-2, 2],
      lactate: [0.5, 2.0],
    };
  };

  const analyzeTrend = (readings) => {
    if (readings.length < 2) {
      return { trend: "insufficient_data", slope: 0, stability: "unknown" };
    }

    const n = readings.length;
    const timeIndex = Array.from({ length: n }, (_, i) => i);

    const meanReadings = readings.reduce((a, b) => a + b, 0) / n;
    const meanTime = timeIndex.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let variance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (readings[i] - meanReadings) * (timeIndex[i] - meanTime);
      variance += Math.pow(timeIndex[i] - meanTime, 2);
    }

    const slope = variance !== 0 ? covariance / variance : 0;

    let trend;
    if (slope > 0.01) trend = "increasing";
    else if (slope < -0.01) trend = "decreasing";
    else trend = "stable";

    const stdev = Math.sqrt(
      readings.reduce((sum, val) => sum + Math.pow(val - meanReadings, 2), 0) /
        n
    );
    const cv = meanReadings > 0 ? Math.abs(stdev / meanReadings) : 0;
    const stability = cv < 0.05 ? "high" : cv < 0.15 ? "medium" : "low";

    return { trend, slope, stability };
  };

  const checkAlerts = (value, normalRange, parameter) => {
    const alerts = [];
    const [low, high] = normalRange;

    if (value < low) {
      if (parameter === "pH" && value < 7.25) {
        alerts.push(
          `CRITICAL: Severe acidemia detected (pH: ${value.toFixed(2)})`
        );
      } else if (parameter === "PaO2" && value < 60) {
        alerts.push(`CRITICAL: Severe hypoxemia (PaO2: ${value} mmHg)`);
      } else if (parameter === "lactate" && value < low) {
        alerts.push(
          `WARNING: ${parameter} slightly low (${value.toFixed(2)} mmol/L)`
        );
      } else {
        alerts.push(`WARNING: ${parameter} low (${value} < ${low})`);
      }
    } else if (value > high) {
      if (parameter === "pH" && value > 7.55) {
        alerts.push(
          `CRITICAL: Severe alkalemia detected (pH: ${value.toFixed(2)})`
        );
      } else if (parameter === "PaCO2" && value > 60) {
        alerts.push(`CRITICAL: Severe hypercapnia (PaCO2: ${value} mmHg)`);
      } else if (parameter === "lactate" && value > 4.0) {
        alerts.push(
          `CRITICAL: Severe hyperlactatemia (${value.toFixed(2)} mmol/L)`
        );
      } else {
        alerts.push(`WARNING: ${parameter} high (${value} > ${high})`);
      }
    }

    return alerts;
  };

  const determineAcidBaseStatus = (pH, paCO2, hco3) => {
    const status = [];

    if (pH < 7.35) {
      if (paCO2 > 45) {
        status.push("Respiratory Acidosis");
        if (hco3 > 26) status.push("with Metabolic Compensation");
      } else if (hco3 < 22) {
        status.push("Metabolic Acidosis");
        if (paCO2 < 35) status.push("with Respiratory Compensation");
      }
    } else if (pH > 7.45) {
      if (paCO2 < 35) {
        status.push("Respiratory Alkalosis");
        if (hco3 < 22) status.push("with Metabolic Compensation");
      } else if (hco3 > 26) {
        status.push("Metabolic Alkalosis");
        if (paCO2 > 45) status.push("with Respiratory Compensation");
      }
    } else {
      status.push("Normal Acid-Base Balance");
    }

    return status.length > 0 ? status.join(" ") : "Normal";
  };

  const analyzeBloodGas = () => {
    const normalRanges = getNormalRanges(sampleType);
    const results = {};
    const allAlerts = [];

    const parseValues = (str) =>
      str
        .split(",")
        .map((v) => parseFloat(v.trim()))
        .filter((v) => !isNaN(v));

    const phVals = parseValues(phValues);
    const pao2Vals = parseValues(pao2Values);
    const paco2Vals = parseValues(paco2Values);
    const hco3Vals = parseValues(hco3Values);
    const beVals = parseValues(baseExcessValues);
    const lactateVals = parseValues(lactateValues);

    const analyzeParameter = (values, paramName, normalRange, unit) => {
      if (values.length === 0) return null;

      const current = values[values.length - 1];
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const analysis = {
        current,
        average,
        min: Math.min(...values),
        max: Math.max(...values),
        unit,
        normal_range: normalRange,
        trend_analysis: analyzeTrend(values),
        alerts: checkAlerts(current, normalRange, paramName),
      };

      allAlerts.push(...analysis.alerts);
      return analysis;
    };

    results.pH = analyzeParameter(phVals, "pH", normalRanges.pH, "");
    results.PaO2 = analyzeParameter(
      pao2Vals,
      "PaO2",
      normalRanges.PaO2,
      "mmHg"
    );
    results.PaCO2 = analyzeParameter(
      paco2Vals,
      "PaCO2",
      normalRanges.PaCO2,
      "mmHg"
    );
    results.HCO3 = analyzeParameter(
      hco3Vals,
      "HCO3",
      normalRanges.HCO3,
      "mEq/L"
    );
    results.base_excess = analyzeParameter(
      beVals,
      "base_excess",
      normalRanges.base_excess,
      "mEq/L"
    );
    results.lactate = analyzeParameter(
      lactateVals,
      "lactate",
      normalRanges.lactate,
      "mmol/L"
    );

    // Acid-base status
    if (phVals.length > 0 && paco2Vals.length > 0 && hco3Vals.length > 0) {
      results.acid_base_status = determineAcidBaseStatus(
        phVals[phVals.length - 1],
        paco2Vals[paco2Vals.length - 1],
        hco3Vals[hco3Vals.length - 1]
      );
    }

    const criticalAlerts = allAlerts.filter((a) => a.includes("CRITICAL"));
    const warningAlerts = allAlerts.filter((a) => a.includes("WARNING"));

    let overallStatus = "NORMAL";
    if (criticalAlerts.length > 0) overallStatus = "CRITICAL";
    else if (warningAlerts.length > 0) overallStatus = "ABNORMAL";

    results.overall_assessment = {
      status: overallStatus,
      critical_alerts: criticalAlerts,
      warning_alerts: warningAlerts,
      total_alerts: allAlerts.length,
      sample_type: sampleType,
      patient_age: patientAge,
      analysis_timestamp: new Date().toISOString(),
    };

    setAnalysis(results);
  };

  const TrendIcon = ({ trend }) => {
    if (trend === "increasing")
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === "decreasing")
      return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const ParameterCard = ({ icon: Icon, title, data, color }) => {
    if (!data) return null;

    return (
      <div
        className="bg-white rounded-lg shadow-md p-6 border-l-4"
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6" style={{ color }} />
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <TrendIcon trend={data.trend_analysis?.trend} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Current:</span>
            <span className="font-bold text-gray-900">
              {data.current?.toFixed(2)} {data.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average:</span>
            <span className="text-gray-700">
              {data.average?.toFixed(2)} {data.unit}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Range:</span>
            <span className="text-gray-500">
              {data.min?.toFixed(2)} - {data.max?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Normal:</span>
            <span className="text-gray-500">
              {data.normal_range[0]} - {data.normal_range[1]}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stability:</span>
            <span
              className={`font-medium ${
                data.trend_analysis?.stability === "high"
                  ? "text-green-600"
                  : data.trend_analysis?.stability === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {data.trend_analysis?.stability}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <TestTube className="w-10 h-10 text-indigo-600" />
            Blood Gas Analyzer
          </h1>
          <p className="text-gray-600">Made by SEIF ELSHAAER - 1200324</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Sample Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Age
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(parseInt(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Type
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="arterial">Arterial Blood</option>
                <option value="venous">Venous Blood</option>
                <option value="capillary">Capillary Blood</option>
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Blood Gas Parameters
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter comma-separated values for multiple readings
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                pH Level
              </label>
              <input
                type="text"
                value={phValues}
                onChange={(e) => setPhValues(e.target.value)}
                placeholder="7.40, 7.38, 7.42"
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PaO2 (mmHg)
              </label>
              <input
                type="text"
                value={pao2Values}
                onChange={(e) => setPao2Values(e.target.value)}
                placeholder="95, 98, 92"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PaCO2 (mmHg)
              </label>
              <input
                type="text"
                value={paco2Values}
                onChange={(e) => setPaco2Values(e.target.value)}
                placeholder="40, 38, 42"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HCO3 (mEq/L)
              </label>
              <input
                type="text"
                value={hco3Values}
                onChange={(e) => setHco3Values(e.target.value)}
                placeholder="24, 23, 25"
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Excess (mEq/L)
              </label>
              <input
                type="text"
                value={baseExcessValues}
                onChange={(e) => setBaseExcessValues(e.target.value)}
                placeholder="0, -1, 1"
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lactate (mmol/L)
              </label>
              <input
                type="text"
                value={lactateValues}
                onChange={(e) => setLactateValues(e.target.value)}
                placeholder="1.2, 1.5, 1.3"
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={analyzeBloodGas}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <TestTube className="w-5 h-5" />
            Analyze Blood Gas
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div
              className={`rounded-xl shadow-lg p-6 ${
                analysis.overall_assessment.status === "CRITICAL"
                  ? "bg-red-50 border-2 border-red-500"
                  : analysis.overall_assessment.status === "ABNORMAL"
                  ? "bg-yellow-50 border-2 border-yellow-500"
                  : "bg-green-50 border-2 border-green-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {analysis.overall_assessment.status === "CRITICAL" ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : analysis.overall_assessment.status === "ABNORMAL" ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Status: {analysis.overall_assessment.status}
                  </h2>
                  {analysis.acid_base_status && (
                    <p className="text-lg text-gray-700 mt-1">
                      {analysis.acid_base_status}
                    </p>
                  )}
                </div>
              </div>

              {analysis.overall_assessment.critical_alerts.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-700 mb-2">
                    Critical Alerts:
                  </h3>
                  {analysis.overall_assessment.critical_alerts.map(
                    (alert, idx) => (
                      <div
                        key={idx}
                        className="bg-red-100 border-l-4 border-red-500 p-3 mb-2 rounded"
                      >
                        <p className="text-red-800">{alert}</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {analysis.overall_assessment.warning_alerts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-2">
                    Warning Alerts:
                  </h3>
                  {analysis.overall_assessment.warning_alerts.map(
                    (alert, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-2 rounded"
                      >
                        <p className="text-yellow-800">{alert}</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {analysis.overall_assessment.total_alerts === 0 && (
                <p className="text-green-700 font-medium">
                  All blood gas parameters within normal ranges
                </p>
              )}
            </div>

            {/* Parameter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ParameterCard
                icon={Zap}
                title="pH Level"
                data={analysis.pH}
                color="#8b5cf6"
              />
              <ParameterCard
                icon={Wind}
                title="PaO2"
                data={analysis.PaO2}
                color="#3b82f6"
              />
              <ParameterCard
                icon={Wind}
                title="PaCO2"
                data={analysis.PaCO2}
                color="#ef4444"
              />
              <ParameterCard
                icon={Droplets}
                title="HCO3"
                data={analysis.HCO3}
                color="#10b981"
              />
              <ParameterCard
                icon={Activity}
                title="Base Excess"
                data={analysis.base_excess}
                color="#f59e0b"
              />
              <ParameterCard
                icon={Droplets}
                title="Lactate"
                data={analysis.lactate}
                color="#ec4899"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodGasAnalyzer;
