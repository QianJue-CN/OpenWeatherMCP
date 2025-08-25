# OpenWeatherMap MCP Server

[English](README.md) | [中文](README_zh.md)

A comprehensive OpenWeatherMap API integration server based on Model Context Protocol (MCP), providing AI assistants with full weather data access capabilities.

## 🌟 Key Features

### Core Weather Functions
- **🌡️ Current Weather Query** - Real-time weather data including temperature, humidity, wind speed, pressure, etc.
- **📅 Weather Forecast** - 5-day/3-hour interval detailed weather forecasts with trend analysis
- **🏭 Air Quality Monitoring** - Real-time air quality index and pollutant concentration data
- **🗺️ Weather Maps** - Multi-layer weather map tiles (clouds, precipitation, temperature, etc.)
- **⚠️ Weather Alerts** - Government-issued weather warnings and safety advisories
- **📊 Historical Weather** - Historical weather data queries and multi-day comparison analysis

### Smart City Name Query
- **🧠 Intelligent Fallback** - Automatically handles both Chinese and English city names
- **🔄 Auto-Geocoding** - When direct city name query fails, automatically uses geocoding to get coordinates
- **🌍 Universal Support** - Works with city names in any language through geocoding API

### Additional Features
- **🌍 Geocoding** - Place name to coordinates conversion with fuzzy search support
- **📍 Reverse Geocoding** - Coordinates to place name conversion
- **🔄 Multi-Unit Support** - Metric, Imperial, and Standard unit systems
- **🌐 Multi-Language Support** - Chinese, English, and many other languages

## 📦 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- OpenWeatherMap API key

### Get API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Register an account and get a free API key
3. Set environment variable:
   ```bash
   export OPENWEATHER_API_KEY="your_api_key_here"
   ```

### Installation Methods

#### Method 1: NPM Global Installation
```bash
npm install -g openweather-mcp
```

#### Method 2: Build from Source
```bash
git clone https://github.com/QianJue-CN/OpenWeatherMCP.git
cd OpenWeatherMCP
npm install
npm run build
```

## 🚀 Usage

### Run as MCP Server
```bash
# Set API key
export OPENWEATHER_API_KEY="your_api_key_here"

# Start server
npx openweather-mcp
```

### Configure in Claude Desktop
Add to Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "openweather": {
      "command": "npx",
      "args": ["openweather-mcp"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Use with Other MCP Clients
Any MCP protocol-compatible client can connect to this server.

## 🛠️ Available Tools

### 1. Current Weather Query (`get_current_weather`)
Get real-time weather information for specified location.

**Parameters:**
- `city` (optional): City name, e.g., "Beijing" or "北京" or "Beijing,CN"
- `lat` (optional): Latitude (-90 to 90)
- `lon` (optional): Longitude (-180 to 180)
- `zip` (optional): Postal code, e.g., "10001,US"
- `units` (optional): Unit system (metric/imperial/standard)
- `lang` (optional): Language code (zh_cn/en/es/fr/de/ja/ko/ru)

**Smart City Name Support:**
- ✅ "北京" (Chinese) → Automatically works
- ✅ "Beijing" (English) → Automatically works
- ✅ "上海" (Chinese) → Automatically works
- ✅ "Shanghai" (English) → Automatically works

**Example:**
```json
{
  "city": "北京",
  "units": "metric",
  "lang": "zh_cn"
}
```

### 2. Weather Forecast (`get_weather_forecast`)
Get 5-day weather forecast data.

**Parameters:**
- Location parameters same as above
- `cnt` (optional): Number of forecast time points (max 40)

**Example:**
```json
{
  "lat": 39.9042,
  "lon": 116.4074,
  "cnt": 16,
  "units": "metric"
}
```

### 3. Air Quality (`get_air_quality`)
Get air quality data.

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `start` (optional): Start timestamp (for historical data)
- `end` (optional): End timestamp (for historical data)

### 4. Weather Maps (`get_weather_map`)
Get weather map tiles.

**Parameters:**
- `layer`: Layer type (clouds_new/precipitation_new/pressure_new/wind_new/temp_new)
- `z`: Zoom level (0-10)
- `x`: Tile X coordinate
- `y`: Tile Y coordinate

### 5. Weather Alerts (`get_weather_alerts`)
Get weather warning information.

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude

### 6. Historical Weather (`get_historical_weather`)
Query historical weather data.

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `dt`: Unix timestamp for query date
- `units`: Unit system
- `lang`: Language code

### 7. Geocoding (`geocoding`)
Get coordinates from place names.

**Parameters:**
- `q`: Location query string
- `limit`: Number of results to return (1-5)

### 8. Reverse Geocoding (`reverse_geocoding`)
Get place names from coordinates.

**Parameters:**
- `lat`: Latitude
- `lon`: Longitude
- `limit`: Number of results to return (1-5)

## 📝 Usage Examples

### Query Beijing Current Weather
```json
{
  "tool": "get_current_weather",
  "parameters": {
    "city": "北京",
    "units": "metric",
    "lang": "zh_cn"
  }
}
```

### Get Shanghai 5-Day Weather Forecast
```json
{
  "tool": "get_weather_forecast",
  "parameters": {
    "city": "上海",
    "units": "metric",
    "lang": "zh_cn"
  }
}
```

### Query Air Quality
```json
{
  "tool": "get_air_quality",
  "parameters": {
    "lat": 39.9042,
    "lon": 116.4074
  }
}
```

## 🌍 How Smart City Name Query Works

1. **Direct Query**: First attempts to query weather using the provided city name directly
2. **Auto Fallback**: If direct query fails (404 error), automatically triggers geocoding
3. **Coordinate Conversion**: Converts city name to precise coordinates via geocoding API
4. **Re-query**: Uses obtained coordinates to re-query weather data
5. **Seamless Experience**: The entire process is transparent to users, no manual handling required

This means you can use city names in any language:
- Chinese: 北京、上海、广州、深圳
- English: Beijing, Shanghai, Guangzhou, Shenzhen
- Other languages: 東京、ソウル、Paris, London

## 🔧 Development

### Project Structure
```
src/
├── index.ts              # MCP server entry point
├── types/
│   ├── weather.ts        # Weather data type definitions
│   └── mcp.ts           # MCP tool type definitions
├── services/
│   └── openweather.ts   # OpenWeatherMap API service
└── tools/
    ├── current-weather.ts    # Current weather tool
    ├── forecast.ts          # Weather forecast tool
    ├── air-pollution.ts     # Air quality tool
    ├── weather-maps.ts      # Weather maps tool
    ├── weather-alerts.ts    # Weather alerts tool
    └── historical-weather.ts # Historical weather tool
```

### Build and Test
```bash
# Install dependencies
npm install

# Build project
npm run build

# Development mode (watch file changes)
npm run dev

# Run tests
npm test

# Code linting
npm run lint
```

## 🌍 Supported Location Formats

### City Names
- `"北京"` - Chinese city name
- `"Beijing"` - English city name
- `"Beijing,CN"` - City name + country code
- `"New York,US"` - Full format

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180
- Example: `lat: 39.9042, lon: 116.4074`

### Postal Codes
- `"10001,US"` - US postal code
- `"100000,CN"` - Chinese postal code

## 📊 Data Formats

### Temperature Units
- `metric`: Celsius (°C)
- `imperial`: Fahrenheit (°F)
- `standard`: Kelvin (K)

### Wind Speed Units
- `metric`: Meters per second (m/s)
- `imperial`: Miles per hour (mph)

### Language Support
- `zh_cn`: Simplified Chinese
- `en`: English
- `es`: Spanish
- `fr`: French
- `de`: German
- `ja`: Japanese
- `ko`: Korean
- `ru`: Russian

## ⚠️ Important Notes

1. **API Limits**: Free accounts have call limits, please use reasonably
2. **Historical Data**: Historical weather data requires paid subscription
3. **One Call API**: Weather alerts feature requires One Call API 3.0 subscription
4. **Network Connection**: Ensure server can access OpenWeatherMap API

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 🔗 Related Links

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [GitHub Repository](https://github.com/QianJue-CN/OpenWeatherMCP)
