
import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Layers, Scale, FileText, Play, Pause, Square, RotateCcw, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react';

function DeviceController() {
  const [deviceId, setDeviceId] = useState('');
  const [sensorData, setSensorData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [command, setCommand] = useState('');
  const [optionalCommand, setOptionalCommand] = useState('');
  const [gCodeFile, setGCodeFile] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // New data form states
  const [newDataForm, setNewDataForm] = useState({
    Temperature1: '',
    Temperature2: '',
    Temperature3: '',
    Temperature4: '',
    OxygenSensor: '',
    NumberOfLayers: '',
    LoadCell: '',
    Command: '',
    OptionalCommand: '',
    GCodeFile: ''
  });

  // Update specific field states
  const [updateField, setUpdateField] = useState('');
  const [updateValue, setUpdateValue] = useState('');

  const BACKEND_URL = "https://aws-connectivity.vercel.app";

  // Convert DynamoDB format to regular format
  const convertFromDynamoFormat = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object') {
        if (value.S !== undefined) converted[key] = value.S;
        else if (value.N !== undefined) converted[key] = parseFloat(value.N);
        else if (value.B !== undefined) converted[key] = value.B;
        else converted[key] = value;
      } else {
        converted[key] = value;
      }
    }
    return converted;
  };

  // Fetch all data for device ID
  const fetchDeviceData = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/device/${deviceId}`);
      const data = await res.json();
      
      // Convert DynamoDB format to regular format
      const convertedData = Array.isArray(data) 
        ? data.map(convertFromDynamoFormat)
        : data ? [convertFromDynamoFormat(data)] : [];
      
      setSensorData(convertedData);
      setLatestData(convertedData[0] || null);
      setIsConnected(true);
  
      if (!autoRefresh) setAutoRefresh(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsConnected(false);
    }
  };
  
  useEffect(() => {
    if (autoRefresh && deviceId) {
      const interval = setInterval(fetchDeviceData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, deviceId]);

  // Send command to Arduino (updates Command field)
  const sendCommand = async () => {
    if (!deviceId || !command) return;
    try {
      await fetch(`${BACKEND_URL}/device/${deviceId}/command?command=${command}`, {
        method: "POST",
      });
      alert("Command sent successfully!");
      setCommand("");
      // Refresh data to see the update
      setTimeout(fetchDeviceData, 1000);
    } catch (error) {
      console.error("Error sending command:", error);
      alert("Failed to send command");
    }
  };

  // Convert to DynamoDB format
  const convertToDynamoFormat = (data) => {
    const converted = {};
    
    // Always include deviceId and timestamp
    converted.deviceId = { S: deviceId };
    converted.timestamp = { N: new Date().toISOString() };
    
    // Define which fields are numbers vs strings
    const numberFields = ['Temperature1', 'Temperature2', 'Temperature3', 'Temperature4', 
                         'AverageTemperature', 'OxygenSensor', 'NumberOfLayers', 'LoadCell'];
    const stringFields = ['Command', 'OptionalCommand', 'GCodeFile'];
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== '' && value !== null && value !== undefined) {
        if (numberFields.includes(key)) {
          converted[key] = { N: value.toString() };
        } else if (stringFields.includes(key)) {
          converted[key] = { S: value.toString() };
        }
      }
    }
    
    return converted;
  };

  // Update specific field
  const updateSpecificField = async () => {
    if (!deviceId || !updateField || updateValue === '') return;
    try {
      // Format for DynamoDB
      const dynamoData = convertToDynamoFormat({ [updateField]: updateValue });
      
      await fetch(`${BACKEND_URL}/device/${deviceId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamoData),
      });
      alert(`${updateField} updated successfully!`);
      setUpdateField('');
      setUpdateValue('');
      // Refresh data to see the update
      setTimeout(fetchDeviceData, 1000);
    } catch (error) {
      console.error("Error updating field:", error);
      alert("Failed to update field");
    }
  };

  // Post new data item
  const postNewData = async () => {
    if (!deviceId) return;
    
    // Filter out empty values
    const filteredData = Object.fromEntries(
      Object.entries(newDataForm).filter(([_, value]) => value !== '')
    );
    
    if (Object.keys(filteredData).length === 0) {
      alert("Please fill at least one field");
      return;
    }

    try {
      // Convert to DynamoDB format
      const dynamoData = convertToDynamoFormat(filteredData);
      
      // Calculate average temperature if multiple temperatures provided
      const temps = ['Temperature1', 'Temperature2', 'Temperature3', 'Temperature4']
        .map(key => filteredData[key] ? parseFloat(filteredData[key]) : null)
        .filter(val => val !== null);
      
      if (temps.length > 1) {
        const avg = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        dynamoData.AverageTemperature = { N: avg.toFixed(1) };
      }
      
      await fetch(`${BACKEND_URL}/device/${deviceId}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamoData),
      });
      alert("New data posted successfully!");
      
      // Clear form
      setNewDataForm({
        Temperature1: '',
        Temperature2: '',
        Temperature3: '',
        Temperature4: '',
        OxygenSensor: '',
        NumberOfLayers: '',
        LoadCell: '',
        Command: '',
        OptionalCommand: '',
        GCodeFile: ''
      });
      
      // Refresh data
      setTimeout(fetchDeviceData, 1000);
    } catch (error) {
      console.error("Error posting new data:", error);
      alert("Failed to post new data");
    }
  };

  // Send G-code file
  const sendGCodeFile = async () => {
    if (!deviceId || !gCodeFile) return;
    try {
      const formData = new FormData();
      formData.append("file", gCodeFile);

      await fetch(`${BACKEND_URL}/device/${deviceId}/gcode`, {
        method: "POST",
        body: formData,
      });

      alert("G-code file uploaded successfully!");
      setGCodeFile(null);
      // Refresh data to see the update
      setTimeout(fetchDeviceData, 1000);
    } catch (error) {
      console.error("Error uploading G-code file:", error);
      alert("Failed to upload G-code file");
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 80) return 'text-red-600';
    if (temp >= 60) return 'text-orange-500';
    if (temp >= 40) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getCommandIcon = (cmd) => {
    switch (cmd) {
      case 'START_PRINT': return <Play className="w-4 h-4" />;
      case 'PAUSE_PRINT': return <Pause className="w-4 h-4" />;
      case 'STOP_PRINT': return <Square className="w-4 h-4" />;
      case 'RESUME_PRINT': return <Play className="w-4 h-4" />;
      case 'RESET': return <RotateCcw className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Arduino Device Controller
          </h1>
          <p className="text-gray-300 text-lg">Advanced IoT Device Management Dashboard</p>
        </div>

        {/* Device Connection Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" />
              Device Connection
            </h3>
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-400">
                <Wifi className="w-5 h-5" />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <WifiOff className="w-5 h-5" />
                <span className="text-sm">Disconnected</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-2">Device ID</label>
              <input
                type="text"
                placeholder="device-002-20250927-211045"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button
              onClick={fetchDeviceData}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Connect & Fetch Data
            </button>
          </div>
          
          {autoRefresh && (
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Auto-refreshing every 5 seconds
            </div>
          )}
        </div>

        {/* Latest Sensor Data */}
        {latestData && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-emerald-300/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                Latest Sensor Reading
              </h3>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Clock className="w-4 h-4" />
                {new Date(latestData.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Temperature Sensors */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <span className="font-medium">Temperature 1</span>
                </div>
                <div className={`text-3xl font-bold ${getTemperatureColor(latestData.Temperature1)}`}>
                  {latestData.Temperature1}°C
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <span className="font-medium">Temperature 2</span>
                </div>
                <div className={`text-3xl font-bold ${getTemperatureColor(latestData.Temperature2)}`}>
                  {latestData.Temperature2}°C
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Temperature 3</span>
                </div>
                <div className={`text-3xl font-bold ${getTemperatureColor(latestData.Temperature3)}`}>
                  {latestData.Temperature3}°C
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-green-400" />
                  <span className="font-medium">Temperature 4</span>
                </div>
                <div className={`text-3xl font-bold ${getTemperatureColor(latestData.Temperature4)}`}>
                  {latestData.Temperature4}°C
                </div>
              </div>
            </div>

            {/* Average Temperature */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-300/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Thermometer className="w-6 h-6 text-purple-400" />
                <span className="font-medium text-lg">Average Temperature</span>
              </div>
              <div className="text-center">
                <span className={`text-4xl font-bold ${getTemperatureColor(latestData.AverageTemperature)}`}>
                  {latestData.AverageTemperature}°C
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Other Sensors */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span className="font-medium">Oxygen Level</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {latestData.OxygenSensor}%
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium">Layers</span>
                </div>
                <div className="text-2xl font-bold text-indigo-400">
                  {latestData.NumberOfLayers}
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span className="font-medium">Load Cell</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {latestData.LoadCell} units
                </div>
              </div>
            </div>

            {/* Commands Status */}
            {(latestData.Command || latestData.OptionalCommand || latestData.GCodeFile) && (
              <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Current Status
                </h4>
                <div className="space-y-2">
                  {latestData.Command && (
                    <div className="flex items-center gap-2">
                      {getCommandIcon(latestData.Command)}
                      <span className="text-blue-300">Command: {latestData.Command}</span>
                    </div>
                  )}
                  {latestData.OptionalCommand && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="text-gray-300">Optional: {latestData.OptionalCommand}</span>
                    </div>
                  )}
                  {latestData.GCodeFile && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-green-300">G-Code: {latestData.GCodeFile}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Send Command */}
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-300/20 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-400" />
              Send Command
            </h3>
            <div className="space-y-4">
              <select
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-800">Select Command</option>
                <option value="START_PRINT" className="bg-gray-800">START_PRINT</option>
                <option value="PAUSE_PRINT" className="bg-gray-800">PAUSE_PRINT</option>
                <option value="STOP_PRINT" className="bg-gray-800">STOP_PRINT</option>
                <option value="RESUME_PRINT" className="bg-gray-800">RESUME_PRINT</option>
                <option value="HEAT_UP" className="bg-gray-800">HEAT_UP</option>
                <option value="COOL_DOWN" className="bg-gray-800">COOL_DOWN</option>
                <option value="RESET" className="bg-gray-800">RESET</option>
              </select>
              <button 
                onClick={sendCommand} 
                disabled={!command}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Send Command
              </button>
            </div>
          </div>

          {/* Update Field */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-300/20 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Update Field
            </h3>
            <div className="space-y-4">
              <select
                value={updateField}
                onChange={(e) => setUpdateField(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-800">Select Field</option>
                <option value="Temperature1" className="bg-gray-800">Temperature 1</option>
                <option value="Temperature2" className="bg-gray-800">Temperature 2</option>
                <option value="Temperature3" className="bg-gray-800">Temperature 3</option>
                <option value="Temperature4" className="bg-gray-800">Temperature 4</option>
                <option value="OxygenSensor" className="bg-gray-800">Oxygen Sensor</option>
                <option value="NumberOfLayers" className="bg-gray-800">Number of Layers</option>
                <option value="LoadCell" className="bg-gray-800">Load Cell</option>
                <option value="OptionalCommand" className="bg-gray-800">Optional Command</option>
              </select>
              <input
                type="text"
                placeholder="New Value"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
              />
              <button 
                onClick={updateSpecificField} 
                disabled={!updateField || updateValue === ''}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Update
              </button>
            </div>
          </div>

          {/* Upload G-code */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-300/20 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Upload G-code
            </h3>
            <div className="space-y-4">
              <input
                type="file"
                accept=".gcode,.txt"
                onChange={(e) => setGCodeFile(e.target.files[0])}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 transition-all duration-300"
              />
              <button 
                onClick={sendGCodeFile} 
                disabled={!gCodeFile}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Upload G-code
              </button>
            </div>
          </div>
        </div>

        {/* Post New Data */}
        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-purple-300/20 shadow-2xl">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            Post New Data Entry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <input
              type="number"
              placeholder="Temperature 1"
              value={newDataForm.Temperature1}
              onChange={(e) => setNewDataForm({...newDataForm, Temperature1: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Temperature 2"
              value={newDataForm.Temperature2}
              onChange={(e) => setNewDataForm({...newDataForm, Temperature2: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Temperature 3"
              value={newDataForm.Temperature3}
              onChange={(e) => setNewDataForm({...newDataForm, Temperature3: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Temperature 4"
              value={newDataForm.Temperature4}
              onChange={(e) => setNewDataForm({...newDataForm, Temperature4: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Oxygen Sensor %"
              value={newDataForm.OxygenSensor}
              onChange={(e) => setNewDataForm({...newDataForm, OxygenSensor: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Number of Layers"
              value={newDataForm.NumberOfLayers}
              onChange={(e) => setNewDataForm({...newDataForm, NumberOfLayers: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="number"
              placeholder="Load Cell"
              value={newDataForm.LoadCell}
              onChange={(e) => setNewDataForm({...newDataForm, LoadCell: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="text"
              placeholder="Command"
              value={newDataForm.Command}
              onChange={(e) => setNewDataForm({...newDataForm, Command: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="text"
              placeholder="Optional Command"
              value={newDataForm.OptionalCommand}
              onChange={(e) => setNewDataForm({...newDataForm, OptionalCommand: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <input
              type="text"
              placeholder="G-Code File Path"
              value={newDataForm.GCodeFile}
              onChange={(e) => setNewDataForm({...newDataForm, GCodeFile: e.target.value})}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <button 
            onClick={postNewData}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Post New Data Entry
          </button>
        </div>

        {/* Historical Data */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" />
              Historical Data
            </h3>
            <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-sm">
              {sensorData.length} records
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
            {sensorData.map((data, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        {new Date(data.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-red-400" />
                      <span className="text-gray-400">Temps:</span>
                      <span className="text-white font-medium">
                        {data.Temperature1}° | {data.Temperature2}° | {data.Temperature3}° | {data.Temperature4}°
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-400">O2:</span>
                      <span className="text-cyan-300 font-medium">{data.OxygenSensor}%</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span className="text-gray-400">Load:</span>
                      <span className="text-amber-300 font-medium">{data.LoadCell}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span className="text-gray-400">Layers:</span>
                      <span className="text-indigo-300 font-medium">{data.NumberOfLayers}</span>
                    </div>
                  </div>
                  
                  {(data.Command || data.OptionalCommand) && (
                    <div className="flex items-center gap-2 text-sm">
                      {getCommandIcon(data.Command)}
                      <span className="text-blue-300">
                        {data.Command}
                        {data.OptionalCommand && (
                          <span className="text-gray-400 ml-2">({data.OptionalCommand})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {sensorData.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 text-lg">No data available</p>
                <p className="text-gray-500 text-sm">Enter a device ID and fetch data to see historical records</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default DeviceController;