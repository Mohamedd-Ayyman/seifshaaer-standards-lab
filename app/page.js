"use client";
import React, { useState } from "react";
import {
  Activity,
  Droplet,
  Wind,
  AlertTriangle,
  CheckCircle,
  ThermometerSun,
} from "lucide-react";

const BloodGasAnalyzer = () => {
  const [patientAge, setPatientAge] = useState(45);
  const [patientCondition, setPatientCondition] = useState("stable");
  const [temperature, setTemperature] = useState(37.0);

  // Blood gas parameters
  const [pH, setPH] = useState(7.4);
  const [paCO2, setPaCO2] = useState(40);
  const [paO2, setPaO2] = useState(95);
  const [hco3, setHCO3] = useState(24);
  const [baseExcess, setBaseExcess] = useState(0);
  const [lactate, setLactate] = useState(1.2);
  const [sodium, setSodium] = useState(140);
  const [potassium, setPotassium] = useState(4.0);
  const [chloride, setChloride] = useState(102);
  const [glucose, setGlucose] = useState(95);

  const [analysis, setAnalysis] = useState(null);

  const getNormalRanges = (age) => {
    let ranges = {
      pH: [7.35, 7.45],
      paCO2: [35, 45],
      paO2: [80, 100],
      hco3: [22, 26],
      baseExcess: [-2, 2],
      lactate: [0.5, 2.2],
      sodium: [136, 145],
      potassium: [3.5, 5.0],
      chloride: [98, 107],
      glucose: [70, 110],
    };

    if (age < 1) {
      ranges.paO2 = [60, 90];
      ranges.paCO2 = [30, 40];
    } else if (age < 12) {
      ranges.paO2 = [75, 100];
    } else if (age > 65) {
      ranges.paO2 = [75, 95];
    }

    return ranges;
  };

  const checkAlert = (value, normalRange, parameter, unit) => {
    const alerts = [];
    const [low, high] = normalRange;

    if (value < low) {
      const severity = [
        "pH",
        "paO2",
        "glucose",
        "sodium",
        "potassium",
      ].includes(parameter)
        ? "CRITICAL"
        : "WARNING";
      alerts.push({
        severity,
        message: `${parameter} low (${value}${unit} < ${low}${unit})`,
      });
    } else if (value > high) {
      const severity = [
        "pH",
        "paCO2",
        "lactate",
        "potassium",
        "glucose",
      ].includes(parameter)
        ? "CRITICAL"
        : "WARNING";
      alerts.push({
        severity,
        message: `${parameter} high (${value}${unit} > ${high}${unit})`,
      });
    }

    // Specific critical conditions
    if (parameter === "pH") {
      if (value < 7.2) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe acidemia - Life threatening",
        });
      } else if (value > 7.6) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe alkalemia - Life threatening",
        });
      }
    }

    if (parameter === "paO2") {
      if (value < 60) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hypoxemia - Immediate intervention required",
        });
      } else if (value < 80) {
        alerts.push({ severity: "WARNING", message: "Moderate hypoxemia" });
      }
    }

    if (parameter === "paCO2") {
      if (value > 60) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hypercapnia - Respiratory failure",
        });
      } else if (value < 30) {
        alerts.push({
          severity: "WARNING",
          message: "Hyperventilation detected",
        });
      }
    }

    if (parameter === "lactate" && value > 4.0) {
      alerts.push({
        severity: "CRITICAL",
        message: "Severe lactic acidosis - Tissue hypoxia",
      });
    }

    if (parameter === "potassium") {
      if (value > 6.0) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hyperkalemia - Cardiac arrhythmia risk",
        });
      } else if (value < 3.0) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hypokalemia - Cardiac arrhythmia risk",
        });
      }
    }

    if (parameter === "glucose") {
      if (value < 50) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hypoglycemia - Neurological risk",
        });
      } else if (value > 300) {
        alerts.push({
          severity: "CRITICAL",
          message: "Severe hyperglycemia - DKA risk",
        });
      }
    }

    return alerts;
  };

  const determineAcidBaseStatus = (ph, paCO2Value, hco3Value) => {
    const status = [];

    if (ph < 7.35) {
      if (paCO2Value > 45) {
        status.push("Respiratory Acidosis");
        if (hco3Value > 26) {
          status.push("with Metabolic Compensation");
        }
      } else if (hco3Value < 22) {
        status.push("Metabolic Acidosis");
        if (paCO2Value < 35) {
          status.push("with Respiratory Compensation");
        }
      }
    } else if (ph > 7.45) {
      if (paCO2Value < 35) {
        status.push("Respiratory Alkalosis");
        if (hco3Value < 22) {
          status.push("with Metabolic Compensation");
        }
      } else if (hco3Value > 26) {
        status.push("Metabolic Alkalosis");
        if (paCO2Value > 45) {
          status.push("with Respiratory Compensation");
        }
      }
    } else {
      status.push("Normal Acid-Base Balance");
    }

    return status.join(" ");
  };

  const calculateAnionGap = (na, cl, hco3Value) => {
    return na - (cl + hco3Value);
  };

  const analyzeBloodGas = () => {
    const normalRanges = getNormalRanges(patientAge);
    const results = {};
    const allAlerts = [];

    // pH Analysis
    const phAnalysis = {
      value: pH,
      normal_range: normalRanges.pH,
      status:
        pH >= normalRanges.pH[0] && pH <= normalRanges.pH[1]
          ? "Normal"
          : "Abnormal",
    };
    const phAlerts = checkAlert(pH, normalRanges.pH, "pH", "");
    phAnalysis.alerts = phAlerts;
    allAlerts.push(...phAlerts);
    results.pH = phAnalysis;

    // PaCO2 Analysis
    const paCO2Analysis = {
      value: paCO2,
      normal_range: normalRanges.paCO2,
      status:
        paCO2 >= normalRanges.paCO2[0] && paCO2 <= normalRanges.paCO2[1]
          ? "Normal"
          : "Abnormal",
    };
    const paCO2Alerts = checkAlert(paCO2, normalRanges.paCO2, "paCO2", " mmHg");
    paCO2Analysis.alerts = paCO2Alerts;
    allAlerts.push(...paCO2Alerts);
    results.paCO2 = paCO2Analysis;

    // PaO2 Analysis
    const paO2Analysis = {
      value: paO2,
      normal_range: normalRanges.paO2,
      status:
        paO2 >= normalRanges.paO2[0] && paO2 <= normalRanges.paO2[1]
          ? "Normal"
          : "Abnormal",
      spo2_estimated: Math.min(
        100,
        Math.round(100 - 100 / (1 + Math.pow(paO2 / 26.8, 2.6)))
      ),
    };
    const paO2Alerts = checkAlert(paO2, normalRanges.paO2, "paO2", " mmHg");
    paO2Analysis.alerts = paO2Alerts;
    allAlerts.push(...paO2Alerts);
    results.paO2 = paO2Analysis;

    // HCO3 Analysis
    const hco3Analysis = {
      value: hco3,
      normal_range: normalRanges.hco3,
      status:
        hco3 >= normalRanges.hco3[0] && hco3 <= normalRanges.hco3[1]
          ? "Normal"
          : "Abnormal",
    };
    const hco3Alerts = checkAlert(hco3, normalRanges.hco3, "HCO3", " mEq/L");
    hco3Analysis.alerts = hco3Alerts;
    allAlerts.push(...hco3Alerts);
    results.hco3 = hco3Analysis;

    // Base Excess Analysis
    const baseExcessAnalysis = {
      value: baseExcess,
      normal_range: normalRanges.baseExcess,
      status:
        baseExcess >= normalRanges.baseExcess[0] &&
        baseExcess <= normalRanges.baseExcess[1]
          ? "Normal"
          : "Abnormal",
    };
    const beAlerts = checkAlert(
      baseExcess,
      normalRanges.baseExcess,
      "Base Excess",
      " mEq/L"
    );
    baseExcessAnalysis.alerts = beAlerts;
    allAlerts.push(...beAlerts);
    results.baseExcess = baseExcessAnalysis;

    // Lactate Analysis
    const lactateAnalysis = {
      value: lactate,
      normal_range: normalRanges.lactate,
      status:
        lactate >= normalRanges.lactate[0] && lactate <= normalRanges.lactate[1]
          ? "Normal"
          : "Abnormal",
    };
    const lactateAlerts = checkAlert(
      lactate,
      normalRanges.lactate,
      "lactate",
      " mmol/L"
    );
    lactateAnalysis.alerts = lactateAlerts;
    allAlerts.push(...lactateAlerts);
    results.lactate = lactateAnalysis;

    // Electrolytes
    const sodiumAnalysis = {
      value: sodium,
      normal_range: normalRanges.sodium,
      status:
        sodium >= normalRanges.sodium[0] && sodium <= normalRanges.sodium[1]
          ? "Normal"
          : "Abnormal",
    };
    const naAlerts = checkAlert(
      sodium,
      normalRanges.sodium,
      "Sodium",
      " mEq/L"
    );
    sodiumAnalysis.alerts = naAlerts;
    allAlerts.push(...naAlerts);
    results.sodium = sodiumAnalysis;

    const potassiumAnalysis = {
      value: potassium,
      normal_range: normalRanges.potassium,
      status:
        potassium >= normalRanges.potassium[0] &&
        potassium <= normalRanges.potassium[1]
          ? "Normal"
          : "Abnormal",
    };
    const kAlerts = checkAlert(
      potassium,
      normalRanges.potassium,
      "potassium",
      " mEq/L"
    );
    potassiumAnalysis.alerts = kAlerts;
    allAlerts.push(...kAlerts);
    results.potassium = potassiumAnalysis;

    const chlorideAnalysis = {
      value: chloride,
      normal_range: normalRanges.chloride,
      status:
        chloride >= normalRanges.chloride[0] &&
        chloride <= normalRanges.chloride[1]
          ? "Normal"
          : "Abnormal",
    };
    const clAlerts = checkAlert(
      chloride,
      normalRanges.chloride,
      "Chloride",
      " mEq/L"
    );
    chlorideAnalysis.alerts = clAlerts;
    allAlerts.push(...clAlerts);
    results.chloride = chlorideAnalysis;

    // Glucose Analysis
    const glucoseAnalysis = {
      value: glucose,
      normal_range: normalRanges.glucose,
      status:
        glucose >= normalRanges.glucose[0] && glucose <= normalRanges.glucose[1]
          ? "Normal"
          : "Abnormal",
    };
    const glucoseAlerts = checkAlert(
      glucose,
      normalRanges.glucose,
      "glucose",
      " mg/dL"
    );
    glucoseAnalysis.alerts = glucoseAlerts;
    allAlerts.push(...glucoseAlerts);
    results.glucose = glucoseAnalysis;

    // Acid-Base Status
    const acidBaseStatus = determineAcidBaseStatus(pH, paCO2, hco3);

    // Anion Gap
    const anionGap = calculateAnionGap(sodium, chloride, hco3);
    let anionGapStatus = "Normal";
    if (anionGap > 12) {
      anionGapStatus = "High (HAGMA - Possible metabolic acidosis)";
      allAlerts.push({
        severity: "WARNING",
        message: `High anion gap: ${anionGap.toFixed(1)} mEq/L`,
      });
    } else if (anionGap < 8) {
      anionGapStatus = "Low";
    }

    results.calculated = {
      acidBaseStatus,
      anionGap: anionGap.toFixed(1),
      anionGapStatus,
    };

    const criticalAlerts = allAlerts.filter((a) => a.severity === "CRITICAL");
    const warningAlerts = allAlerts.filter((a) => a.severity === "WARNING");

    let overallStatus = "NORMAL";
    if (criticalAlerts.length > 0) overallStatus = "CRITICAL";
    else if (warningAlerts.length > 0) overallStatus = "ABNORMAL";

    results.overall_assessment = {
      status: overallStatus,
      critical_alerts: criticalAlerts,
      warning_alerts: warningAlerts,
      total_alerts: allAlerts.length,
      patient_age: patientAge,
      patient_condition: patientCondition,
      temperature: temperature,
      analysis_timestamp: new Date().toISOString(),
    };

    setAnalysis(results);
  };

  const ParameterCard = ({ icon: Icon, title, data, color, unit }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between items-center">
          <span className="font-medium">Value:</span>
          <span className="text-xl font-bold">
            {data.value}
            {unit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Normal Range:</span>
          <span>
            {data.normal_range[0]} - {data.normal_range[1]}
            {unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Status:</span>
          <span
            className={`font-semibold ${
              data.status === "Normal" ? "text-green-600" : "text-red-600"
            }`}
          >
            {data.status}
          </span>
        </div>
        {data.spo2_estimated && (
          <div className="flex justify-between">
            <span className="font-medium">Est. SpO2:</span>
            <span>{data.spo2_estimated}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Droplet className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Blood Gas Analyzer
            </h1>
          </div>
          <p className="text-gray-600 mb-2">
            Arterial blood gas analysis and interpretation system
          </p>
          <p className="text-sm text-gray-500">
            Made by SEIF ELSHAAER - 1200324
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="stable">Stable</option>
                <option value="critical">Critical</option>
                <option value="post-op">Post-Op</option>
                <option value="icu">ICU</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Blood Gas Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                pH
              </label>
              <input
                type="number"
                step="0.01"
                value={pH}
                onChange={(e) => setPH(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PaCO₂ (mmHg)
              </label>
              <input
                type="number"
                step="0.1"
                value={paCO2}
                onChange={(e) => setPaCO2(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PaO₂ (mmHg)
              </label>
              <input
                type="number"
                step="0.1"
                value={paO2}
                onChange={(e) => setPaO2(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HCO₃⁻ (mEq/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={hco3}
                onChange={(e) => setHCO3(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Excess (mEq/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={baseExcess}
                onChange={(e) => setBaseExcess(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lactate (mmol/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={lactate}
                onChange={(e) => setLactate(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">
            Electrolytes & Glucose
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sodium (mEq/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={sodium}
                onChange={(e) => setSodium(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potassium (mEq/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={potassium}
                onChange={(e) => setPotassium(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chloride (mEq/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={chloride}
                onChange={(e) => setChloride(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glucose (mg/dL)
              </label>
              <input
                type="number"
                step="1"
                value={glucose}
                onChange={(e) => setGlucose(parseFloat(e.target.value))}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={analyzeBloodGas}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <Activity className="w-5 h-5" />
            <span>Analyze Blood Gas</span>
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div
              className={`rounded-xl shadow-xl p-8 ${
                analysis.overall_assessment.status === "CRITICAL"
                  ? "bg-red-50 border-2 border-red-500"
                  : analysis.overall_assessment.status === "ABNORMAL"
                  ? "bg-yellow-50 border-2 border-yellow-500"
                  : "bg-green-50 border-2 border-green-500"
              }`}
            >
              <div className="flex items-center space-x-4 mb-4">
                {analysis.overall_assessment.status === "CRITICAL" ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : analysis.overall_assessment.status === "ABNORMAL" ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  Overall Status: {analysis.overall_assessment.status}
                </h2>
              </div>

              <div className="mb-6 p-4 bg-white rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Acid-Base Interpretation
                </h3>
                <p className="text-lg font-medium text-indigo-700">
                  {analysis.calculated.acidBaseStatus}
                </p>
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Anion Gap: </span>
                  <span>
                    {analysis.calculated.anionGap} mEq/L -{" "}
                    {analysis.calculated.anionGapStatus}
                  </span>
                </div>
              </div>

              {analysis.overall_assessment.critical_alerts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-red-700 mb-2">
                    Critical Alerts:
                  </h3>
                  <ul className="space-y-2">
                    {analysis.overall_assessment.critical_alerts.map(
                      (alert, idx) => (
                        <li
                          key={idx}
                          className="flex items-start space-x-2 text-red-800"
                        >
                          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <span>{alert.message}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {analysis.overall_assessment.warning_alerts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-2">
                    Warning Alerts:
                  </h3>
                  <ul className="space-y-2">
                    {analysis.overall_assessment.warning_alerts.map(
                      (alert, idx) => (
                        <li
                          key={idx}
                          className="flex items-start space-x-2 text-yellow-800"
                        >
                          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <span>{alert.message}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {analysis.overall_assessment.total_alerts === 0 && (
                <p className="text-green-800 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>All blood gas parameters within normal ranges</span>
                </p>
              )}
            </div>

            <h3 className="text-2xl font-semibold text-gray-800">
              Detailed Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.pH && (
                <ParameterCard
                  icon={Activity}
                  title="pH"
                  data={analysis.pH}
                  color="border-purple-500"
                  unit=""
                />
              )}
              {analysis.paCO2 && (
                <ParameterCard
                  icon={Wind}
                  title="PaCO₂"
                  data={analysis.paCO2}
                  color="border-blue-500"
                  unit=" mmHg"
                />
              )}
              {analysis.paO2 && (
                <ParameterCard
                  icon={Wind}
                  title="PaO₂"
                  data={analysis.paO2}
                  color="border-cyan-500"
                  unit=" mmHg"
                />
              )}
              {analysis.hco3 && (
                <ParameterCard
                  icon={Droplet}
                  title="HCO₃⁻"
                  data={analysis.hco3}
                  color="border-green-500"
                  unit=" mEq/L"
                />
              )}
              {analysis.baseExcess && (
                <ParameterCard
                  icon={Activity}
                  title="Base Excess"
                  data={analysis.baseExcess}
                  color="border-indigo-500"
                  unit=" mEq/L"
                />
              )}
              {analysis.lactate && (
                <ParameterCard
                  icon={AlertTriangle}
                  title="Lactate"
                  data={analysis.lactate}
                  color="border-red-500"
                  unit=" mmol/L"
                />
              )}
              {analysis.sodium && (
                <ParameterCard
                  icon={Droplet}
                  title="Sodium (Na⁺)"
                  data={analysis.sodium}
                  color="border-yellow-500"
                  unit=" mEq/L"
                />
              )}
              {analysis.potassium && (
                <ParameterCard
                  icon={Droplet}
                  title="Potassium (K⁺)"
                  data={analysis.potassium}
                  color="border-orange-500"
                  unit=" mEq/L"
                />
              )}
              {analysis.chloride && (
                <ParameterCard
                  icon={Droplet}
                  title="Chloride (Cl⁻)"
                  data={analysis.chloride}
                  color="border-teal-500"
                  unit=" mEq/L"
                />
              )}
              {analysis.glucose && (
                <ParameterCard
                  icon={ThermometerSun}
                  title="Glucose"
                  data={analysis.glucose}
                  color="border-pink-500"
                  unit=" mg/dL"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodGasAnalyzer;
