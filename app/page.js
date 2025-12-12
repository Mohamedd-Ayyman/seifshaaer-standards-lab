"use client";
import React, { useState } from "react";
import {
  Activity,
  Heart,
  Wind,
  Droplet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const VitalSignsAnalyzer = () => {
  const [patientAge, setPatientAge] = useState(45);
  const [patientCondition, setPatientCondition] = useState("stable");
  const [heartRates, setHeartRates] = useState("72, 75, 78, 76, 74");
  const [bloodPressures, setBloodPressures] = useState(
    "120/80, 118/78, 122/82, 119/79"
  );
  const [spo2Values, setSpo2Values] = useState("98.5, 98.2, 97.8, 98.0");
  const [respiratoryRates, setRespiratoryRates] = useState("16, 15, 17, 16");
  const [analysis, setAnalysis] = useState(null);

  const getNormalRanges = (age, condition) => {
    let ranges = {
      heart_rate: [60, 100],
      systolic_bp: [90, 120],
      diastolic_bp: [60, 80],
      spo2: [95.0, 100.0],
      respiratory_rate: [12, 20],
    };

    if (age < 1) {
      ranges.heart_rate = [100, 160];
      ranges.respiratory_rate = [30, 60];
    } else if (age < 3) {
      ranges.heart_rate = [80, 130];
      ranges.respiratory_rate = [24, 40];
    } else if (age < 12) {
      ranges.heart_rate = [70, 110];
      ranges.respiratory_rate = [18, 30];
    } else if (age > 65) {
      ranges.heart_rate = [60, 100];
      ranges.systolic_bp = [90, 140];
    }

    if (condition === "critical") {
      ranges.spo2 = [88.0, 100.0];
    }

    return ranges;
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
    if (slope > 0.1) trend = "increasing";
    else if (slope < -0.1) trend = "decreasing";
    else trend = "stable";

    const stdev = Math.sqrt(
      readings.reduce((sum, val) => sum + Math.pow(val - meanReadings, 2), 0) /
        n
    );
    const cv = meanReadings > 0 ? stdev / meanReadings : 0;
    const stability = cv < 0.1 ? "high" : cv < 0.2 ? "medium" : "low";

    return { trend, slope, stability };
  };

  const checkAlerts = (value, normalRange, vitalSign) => {
    const alerts = [];
    const [low, high] = normalRange;

    if (value < low) {
      const severity = ["spo2", "heart_rate"].includes(vitalSign)
        ? "CRITICAL"
        : "WARNING";
      alerts.push(
        `${severity}: ${vitalSign.replace("_", " ")} low (${value} < ${low})`
      );
    } else if (value > high) {
      const severity = ["heart_rate", "systolic_bp"].includes(vitalSign)
        ? "CRITICAL"
        : "WARNING";
      alerts.push(
        `${severity}: ${vitalSign.replace("_", " ")} high (${value} > ${high})`
      );
    }

    if (vitalSign === "spo2" && value < 90) {
      alerts.push("CRITICAL: Severe hypoxemia detected");
    } else if (vitalSign === "heart_rate" && value > 150) {
      alerts.push("CRITICAL: Tachycardia detected");
    } else if (vitalSign === "systolic_bp" && value > 180) {
      alerts.push("CRITICAL: Hypertensive crisis");
    }

    return alerts;
  };

  const analyzeVitalSigns = () => {
    const normalRanges = getNormalRanges(patientAge, patientCondition);
    const results = {};
    const allAlerts = [];

    const hrValues = heartRates
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));
    const bpValues = bloodPressures
      .split(",")
      .map((bp) => {
        const [sys, dia] = bp
          .trim()
          .split("/")
          .map((v) => parseFloat(v));
        return [sys, dia];
      })
      .filter((bp) => !isNaN(bp[0]) && !isNaN(bp[1]));
    const spo2Vals = spo2Values
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));
    const rrValues = respiratoryRates
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));

    if (hrValues.length > 0) {
      const currentHr = hrValues[hrValues.length - 1];
      const hrAnalysis = {
        current: currentHr,
        average: hrValues.reduce((a, b) => a + b, 0) / hrValues.length,
        min: Math.min(...hrValues),
        max: Math.max(...hrValues),
        variability:
          hrValues.length > 1
            ? Math.sqrt(
                hrValues.reduce((sum, val) => {
                  const mean =
                    hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
                  return sum + Math.pow(val - mean, 2);
                }, 0) / hrValues.length
              )
            : 0,
        normal_range: normalRanges.heart_rate,
        trend_analysis: analyzeTrend(hrValues),
      };
      hrAnalysis.alerts = checkAlerts(
        currentHr,
        normalRanges.heart_rate,
        "heart_rate"
      );
      allAlerts.push(...hrAnalysis.alerts);
      results.heart_rate = hrAnalysis;
    }

    if (bpValues.length > 0) {
      const currentBp = bpValues[bpValues.length - 1];
      const systolicVals = bpValues.map((bp) => bp[0]);
      const diastolicVals = bpValues.map((bp) => bp[1]);

      const bpAnalysis = {
        current: currentBp,
        systolic: {
          average:
            systolicVals.reduce((a, b) => a + b, 0) / systolicVals.length,
          min: Math.min(...systolicVals),
          max: Math.max(...systolicVals),
          trend: analyzeTrend(systolicVals),
        },
        diastolic: {
          average:
            diastolicVals.reduce((a, b) => a + b, 0) / diastolicVals.length,
          min: Math.min(...diastolicVals),
          max: Math.max(...diastolicVals),
          trend: analyzeTrend(diastolicVals),
        },
        normal_range: {
          systolic: normalRanges.systolic_bp,
          diastolic: normalRanges.diastolic_bp,
        },
      };
      bpAnalysis.alerts = [
        ...checkAlerts(currentBp[0], normalRanges.systolic_bp, "systolic_bp"),
        ...checkAlerts(currentBp[1], normalRanges.diastolic_bp, "diastolic_bp"),
      ];
      allAlerts.push(...bpAnalysis.alerts);
      results.blood_pressure = bpAnalysis;
    }

    if (spo2Vals.length > 0) {
      const currentSpo2 = spo2Vals[spo2Vals.length - 1];
      const spo2Analysis = {
        current: currentSpo2,
        average: spo2Vals.reduce((a, b) => a + b, 0) / spo2Vals.length,
        min: Math.min(...spo2Vals),
        max: Math.max(...spo2Vals),
        normal_range: normalRanges.spo2,
        trend_analysis: analyzeTrend(spo2Vals),
      };
      spo2Analysis.alerts = checkAlerts(currentSpo2, normalRanges.spo2, "spo2");
      allAlerts.push(...spo2Analysis.alerts);
      results.spo2 = spo2Analysis;
    }

    if (rrValues.length > 0) {
      const currentRr = rrValues[rrValues.length - 1];
      const rrAnalysis = {
        current: currentRr,
        average: rrValues.reduce((a, b) => a + b, 0) / rrValues.length,
        min: Math.min(...rrValues),
        max: Math.max(...rrValues),
        normal_range: normalRanges.respiratory_rate,
        trend_analysis: analyzeTrend(rrValues),
      };
      rrAnalysis.alerts = checkAlerts(
        currentRr,
        normalRanges.respiratory_rate,
        "respiratory_rate"
      );
      allAlerts.push(...rrAnalysis.alerts);
      results.respiratory_rate = rrAnalysis;
    }

    const criticalAlerts = allAlerts.filter((a) => a.includes("CRITICAL"));
    const warningAlerts = allAlerts.filter((a) => a.includes("WARNING"));

    let overallStatus = "STABLE";
    if (criticalAlerts.length > 0) overallStatus = "CRITICAL";
    else if (warningAlerts.length > 0) overallStatus = "WARNING";

    results.overall_assessment = {
      status: overallStatus,
      critical_alerts: criticalAlerts,
      warning_alerts: warningAlerts,
      total_alerts: allAlerts.length,
      patient_age: patientAge,
      patient_condition: patientCondition,
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

  const VitalCard = ({ icon: Icon, title, data, color }) => (
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
            {typeof data.current === "object"
              ? `${data.current[0]}/${data.current[1]}`
              : data.current?.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Average:</span>
          <span className="text-gray-700">{data.average?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Range:</span>
          <span className="text-gray-500">
            {data.min?.toFixed(1)} - {data.max?.toFixed(1)}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Activity className="w-10 h-10 text-indigo-600" />
            Vital Signs Analyzer
          </h1>
          <p className="text-gray-600">Made by SEIF ELSHAAER - 1200324 </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Patient Information
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
                Patient Condition
              </label>
              <select
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="stable">Stable</option>
                <option value="critical">Critical</option>
                <option value="post_op">Post-Op</option>
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Vital Signs Data
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter comma-separated values for multiple readings
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (bpm)
              </label>
              <input
                type="text"
                value={heartRates}
                onChange={(e) => setHeartRates(e.target.value)}
                placeholder="72, 75, 78"
                className="w-full px-4 py-2 text-black border  border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure (systolic/diastolic)
              </label>
              <input
                type="text"
                value={bloodPressures}
                onChange={(e) => setBloodPressures(e.target.value)}
                placeholder="120/80, 118/78"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SpO2 (%)
              </label>
              <input
                type="text"
                value={spo2Values}
                onChange={(e) => setSpo2Values(e.target.value)}
                placeholder="98.5, 98.2, 97.8"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="text"
                value={respiratoryRates}
                onChange={(e) => setRespiratoryRates(e.target.value)}
                placeholder="16, 15, 17"
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={analyzeVitalSigns}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            <Activity className="w-5 h-5" />
            Analyze Vital Signs
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div
              className={`rounded-xl shadow-lg p-6 ${
                analysis.overall_assessment.status === "CRITICAL"
                  ? "bg-red-50 border-2 border-red-500"
                  : analysis.overall_assessment.status === "WARNING"
                  ? "bg-yellow-50 border-2 border-yellow-500"
                  : "bg-green-50 border-2 border-green-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {analysis.overall_assessment.status === "CRITICAL" ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : analysis.overall_assessment.status === "WARNING" ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  Overall Status: {analysis.overall_assessment.status}
                </h2>
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
                  All vital signs within normal ranges
                </p>
              )}
            </div>

            {/* Vital Signs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analysis.heart_rate && (
                <VitalCard
                  icon={Heart}
                  title="Heart Rate"
                  data={analysis.heart_rate}
                  color="#ef4444"
                />
              )}
              {analysis.blood_pressure && (
                <VitalCard
                  icon={Activity}
                  title="Blood Pressure"
                  data={{
                    ...analysis.blood_pressure,
                    average: analysis.blood_pressure.systolic.average,
                    min: analysis.blood_pressure.systolic.min,
                    max: analysis.blood_pressure.systolic.max,
                    trend_analysis: analysis.blood_pressure.systolic.trend,
                  }}
                  color="#8b5cf6"
                />
              )}
              {analysis.spo2 && (
                <VitalCard
                  icon={Droplet}
                  title="SpO2"
                  data={analysis.spo2}
                  color="#3b82f6"
                />
              )}
              {analysis.respiratory_rate && (
                <VitalCard
                  icon={Wind}
                  title="Respiratory Rate"
                  data={analysis.respiratory_rate}
                  color="#10b981"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalSignsAnalyzer;
