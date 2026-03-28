import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Home, Zap, Shield, Camera, Cpu, Settings, Search, X, ChevronRight,
  ChevronDown, Sun, Moon, Thermometer, Lock, Unlock, Fan, Droplets,
  Power, Lightbulb, ToggleLeft, ToggleRight, Activity, BarChart3,
  Bell, BellOff, Eye, EyeOff, Wifi, WifiOff, Battery, BatteryCharging,
  Gauge, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Play, Pause, SkipForward, Volume2, VolumeX, Send, Bot, Terminal,
  GitBranch, Globe, Database, Layers, Command, Plus, Minus, Edit3,
  Trash2, Check, AlertTriangle, Info, Clock, Calendar, MapPin,
  CircleDot, Maximize2, Minimize2, PanelLeftClose, PanelLeft,
  Video, VideoOff, SunMedium, CloudRain, Wind, Flame, Plug,
  Router, Smartphone, MonitorSpeaker, Cctv, DoorOpen, DoorClosed,
  LayoutDashboard, Workflow, MessageSquare, Sparkles
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS OS — Unified Smart Home Command Center
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Design Tokens ───────────────────────────────────────────────────────────
const T = {
  bg: {
    deep: "#08080b",
    base: "#0c0c10",
    card: "rgba(255,255,255,0.02)",
    cardHover: "rgba(255,255,255,0.04)",
    elevated: "rgba(255,255,255,0.06)",
    input: "rgba(255,255,255,0.04)",
  },
  border: {
    subtle: "rgba(255,255,255,0.05)",
    medium: "rgba(255,255,255,0.08)",
    accent: "rgba(96,165,250,0.3)",
  },
  text: {
    primary: "rgba(255,255,255,0.92)",
    secondary: "rgba(255,255,255,0.55)",
    tertiary: "rgba(255,255,255,0.25)",
    muted: "rgba(255,255,255,0.12)",
  },
  accent: {
    blue: "#60A5FA",
    green: "#6EE7B7",
    red: "#F87171",
    yellow: "#FBBF24",
    purple: "#A78BFA",
    cyan: "#67E8F9",
    orange: "#FB923C",
  },
  font: {
    body: "'DM Sans', -apple-system, sans-serif",
    display: "'Outfit', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};

// ─── Mock HA Data ────────────────────────────────────────────────────────────
// In production, these come from the WebSocket/REST client
const MOCK_AREAS = [
  { id: "living_room", name: "Living Room", icon: MonitorSpeaker },
  { id: "bedroom", name: "Bedroom", icon: Moon },
  { id: "kitchen", name: "Kitchen", icon: Flame },
  { id: "office", name: "Office", icon: Cpu },
  { id: "garage", name: "Garage", icon: DoorClosed },
  { id: "exterior", name: "Exterior", icon: Globe },
];

const MOCK_ENTITIES = [
  { entity_id: "light.living_room", friendly_name: "Living Room Lights", area: "living_room", state: "on", domain: "light", attributes: { brightness: 204, color_temp: 350 } },
  { entity_id: "light.bedroom", friendly_name: "Bedroom Lights", area: "bedroom", state: "off", domain: "light", attributes: { brightness: 0 } },
  { entity_id: "light.kitchen", friendly_name: "Kitchen Lights", area: "kitchen", state: "on", domain: "light", attributes: { brightness: 255 } },
  { entity_id: "light.office_desk", friendly_name: "Desk Lamp", area: "office", state: "on", domain: "light", attributes: { brightness: 180 } },
  { entity_id: "light.garage", friendly_name: "Garage Light", area: "garage", state: "off", domain: "light", attributes: { brightness: 0 } },
  { entity_id: "light.porch", friendly_name: "Porch Light", area: "exterior", state: "on", domain: "light", attributes: { brightness: 128 } },
  { entity_id: "climate.main_floor", friendly_name: "Main Thermostat", area: "living_room", state: "cool", domain: "climate", attributes: { temperature: 72, current_temperature: 74, hvac_action: "cooling" } },
  { entity_id: "climate.bedroom", friendly_name: "Bedroom AC", area: "bedroom", state: "cool", domain: "climate", attributes: { temperature: 68, current_temperature: 70, hvac_action: "idle" } },
  { entity_id: "lock.front_door", friendly_name: "Front Door", area: "exterior", state: "locked", domain: "lock", attributes: {} },
  { entity_id: "lock.garage_door", friendly_name: "Garage Door Lock", area: "garage", state: "locked", domain: "lock", attributes: {} },
  { entity_id: "binary_sensor.front_door", friendly_name: "Front Door", area: "exterior", state: "off", domain: "binary_sensor", attributes: { device_class: "door" } },
  { entity_id: "binary_sensor.motion_office", friendly_name: "Office Motion", area: "office", state: "on", domain: "binary_sensor", attributes: { device_class: "motion" } },
  { entity_id: "sensor.indoor_temp", friendly_name: "Indoor Temperature", area: "living_room", state: "74.2", domain: "sensor", attributes: { unit_of_measurement: "°F", device_class: "temperature" } },
  { entity_id: "sensor.outdoor_temp", friendly_name: "Outdoor Temperature", area: "exterior", state: "101.4", domain: "sensor", attributes: { unit_of_measurement: "°F", device_class: "temperature" } },
  { entity_id: "sensor.humidity", friendly_name: "Indoor Humidity", area: "living_room", state: "38", domain: "sensor", attributes: { unit_of_measurement: "%", device_class: "humidity" } },
  { entity_id: "fan.living_room", friendly_name: "Ceiling Fan", area: "living_room", state: "on", domain: "fan", attributes: { percentage: 66 } },
  { entity_id: "fan.bedroom", friendly_name: "Bedroom Fan", area: "bedroom", state: "off", domain: "fan", attributes: { percentage: 0 } },
  { entity_id: "media_player.living_room", friendly_name: "Living Room TV", area: "living_room", state: "off", domain: "media_player", attributes: { source: "Apple TV" } },
  { entity_id: "switch.office_monitor", friendly_name: "Monitor Power", area: "office", state: "on", domain: "switch", attributes: {} },
  { entity_id: "cover.garage", friendly_name: "Garage Door", area: "garage", state: "closed", domain: "cover", attributes: {} },
];

const MOCK_SCENES = [
  { id: "good_morning", name: "Good Morning", icon: SunMedium, description: "Lights 80%, AC to 72, unlock doors" },
  { id: "movie_mode", name: "Movie Mode", icon: Video, description: "Dim lights, TV on, close blinds" },
  { id: "good_night", name: "Good Night", icon: Moon, description: "All lights off, lock up, AC to 68" },
  { id: "away", name: "Away Mode", icon: Shield, description: "Lock all, cameras armed, lights random" },
  { id: "focus", name: "Focus Mode", icon: Eye, description: "Office lights 100%, notifications off" },
  { id: "cool_down", name: "Cool Down", icon: Wind, description: "All fans max, AC to 70" },
];

// Energy mock data
const genEnergyData = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const solar = i >= 6 && i <= 18 ? Math.sin((i - 6) / 12 * Math.PI) * 4.2 + Math.random() * 0.5 : 0;
    const consumption = 0.8 + Math.random() * 2.5 + (i >= 14 && i <= 20 ? 2 : 0);
    hours.push({
      hour: `${i.toString().padStart(2, "0")}:00`,
      solar: +solar.toFixed(2),
      consumption: +consumption.toFixed(2),
      grid: +(consumption - solar).toFixed(2),
    });
  }
  return hours;
};

const ENERGY_DATA = genEnergyData();
const ENERGY_DEVICES = [
  { name: "HVAC System", kwh: 8.4, pct: 42, icon: Thermometer, color: T.accent.blue },
  { name: "Water Heater", kwh: 3.2, pct: 16, icon: Droplets, color: T.accent.cyan },
  { name: "Kitchen Appliances", kwh: 2.8, pct: 14, icon: Flame, color: T.accent.orange },
  { name: "Lighting", kwh: 1.6, pct: 8, icon: Lightbulb, color: T.accent.yellow },
  { name: "Electronics", kwh: 2.1, pct: 10.5, icon: Plug, color: T.accent.purple },
  { name: "Other", kwh: 1.9, pct: 9.5, icon: Zap, color: T.accent.green },
];

// Camera mock data
const MOCK_CAMERAS = [
  { id: "front_yard", name: "Front Yard", status: "recording", detections: 3, lastEvent: "Person detected 12m ago", fps: 15 },
  { id: "back_yard", name: "Back Yard", status: "recording", detections: 0, lastEvent: "Cat detected 2h ago", fps: 15 },
  { id: "driveway", name: "Driveway", status: "recording", detections: 1, lastEvent: "Vehicle detected 45m ago", fps: 10 },
  { id: "garage", name: "Garage", status: "idle", detections: 0, lastEvent: "No events today", fps: 5 },
];

// Automation mock data
const MOCK_AUTOMATIONS = [
  { id: "1", alias: "Motion Lights — Hallway", state: "on", last_triggered: "2026-03-28T14:22:00", trigger: "motion sensor", action: "Turn on hallway light for 5 min" },
  { id: "2", alias: "Good Night Routine", state: "on", last_triggered: "2026-03-27T22:30:00", trigger: "Time: 10:30 PM", action: "Lock doors, lights off, AC to 68" },
  { id: "3", alias: "AC Auto-Adjust", state: "on", last_triggered: "2026-03-28T15:00:00", trigger: "Outdoor temp > 100°F", action: "Set AC to 70, close blinds" },
  { id: "4", alias: "Garage Door Alert", state: "on", last_triggered: "2026-03-28T09:15:00", trigger: "Garage open > 10 min", action: "Send notification" },
  { id: "5", alias: "Morning Briefing", state: "off", last_triggered: "2026-03-27T07:00:00", trigger: "Time: 7:00 AM weekdays", action: "TTS weather, calendar, energy" },
];

// ─── Utility Components ──────────────────────────────────────────────────────

const Card = ({ children, className = "", style = {}, onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl transition-all duration-200 ${onClick ? "cursor-pointer" : ""} ${className}`}
    style={{
      background: T.bg.card,
      border: `1px solid ${T.border.subtle}`,
      ...(hover && onClick ? {} : {}),
      ...style,
    }}
    onMouseEnter={(e) => {
      if (hover && onClick) {
        e.currentTarget.style.background = T.bg.cardHover;
        e.currentTarget.style.borderColor = T.border.medium;
      }
    }}
    onMouseLeave={(e) => {
      if (hover && onClick) {
        e.currentTarget.style.background = T.bg.card;
        e.currentTarget.style.borderColor = T.border.subtle;
      }
    }}
  >
    {children}
  </div>
);

const Badge = ({ children, color = T.accent.blue, size = "sm" }) => (
  <span
    className={`inline-flex items-center font-medium rounded-full ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
    style={{ background: `${color}15`, color }}
  >
    {children}
  </span>
);

const StatCard = ({ label, value, unit, icon: Icon, trend, trendValue, color = T.accent.blue }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {trend && (
        <div className="flex items-center gap-1" style={{ color: trend === "up" ? T.accent.green : T.accent.red }}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{trendValue}</span>
        </div>
      )}
    </div>
    <div className="text-2xl font-semibold tracking-tight" style={{ color: T.text.primary, fontFamily: T.font.mono }}>
      {value}
      {unit && <span className="text-sm ml-1" style={{ color: T.text.tertiary }}>{unit}</span>}
    </div>
    <div className="text-[11px] mt-1" style={{ color: T.text.tertiary }}>{label}</div>
  </Card>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-sm font-semibold tracking-wide" style={{ color: T.text.primary, fontFamily: T.font.display }}>{title}</h2>
      {subtitle && <p className="text-[11px] mt-0.5" style={{ color: T.text.tertiary }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Entity Card ─────────────────────────────────────────────────────────────

const EntityCard = ({ entity, onToggle }) => {
  const isOn = entity.state === "on" || entity.state === "cool" || entity.state === "heat" || entity.state === "locked" || entity.state === "playing";
  const domain = entity.domain;

  const getIcon = () => {
    switch (domain) {
      case "light": return Lightbulb;
      case "climate": return Thermometer;
      case "lock": return entity.state === "locked" ? Lock : Unlock;
      case "fan": return Fan;
      case "binary_sensor": return entity.attributes?.device_class === "motion" ? Activity : DoorOpen;
      case "sensor": return entity.attributes?.device_class === "temperature" ? Thermometer : entity.attributes?.device_class === "humidity" ? Droplets : Gauge;
      case "media_player": return MonitorSpeaker;
      case "switch": return Power;
      case "cover": return entity.state === "closed" ? DoorClosed : DoorOpen;
      default: return CircleDot;
    }
  };

  const getColor = () => {
    if (!isOn) return T.text.tertiary;
    switch (domain) {
      case "light": return T.accent.yellow;
      case "climate": return entity.state === "cool" ? T.accent.blue : T.accent.red;
      case "lock": return entity.state === "locked" ? T.accent.green : T.accent.red;
      case "fan": return T.accent.cyan;
      case "binary_sensor": return entity.state === "on" ? T.accent.purple : T.text.tertiary;
      case "sensor": return T.accent.blue;
      case "media_player": return T.accent.purple;
      case "switch": return T.accent.green;
      default: return T.accent.blue;
    }
  };

  const getStateText = () => {
    switch (domain) {
      case "light": return isOn ? `${Math.round((entity.attributes.brightness / 255) * 100)}%` : "Off";
      case "climate": return `${entity.attributes.current_temperature}° → ${entity.attributes.temperature}°`;
      case "lock": return entity.state === "locked" ? "Locked" : "Unlocked";
      case "fan": return isOn ? `${entity.attributes.percentage}%` : "Off";
      case "sensor": return `${entity.state}${entity.attributes.unit_of_measurement || ""}`;
      case "cover": return entity.state === "closed" ? "Closed" : "Open";
      default: return entity.state;
    }
  };

  const Icon = getIcon();
  const color = getColor();
  const toggleable = ["light", "switch", "fan", "lock", "cover", "media_player"].includes(domain);

  return (
    <Card
      onClick={toggleable ? () => onToggle(entity.entity_id) : undefined}
      className="p-3 group"
      style={{
        background: isOn ? `${color}08` : T.bg.card,
        borderColor: isOn ? `${color}20` : T.border.subtle,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: T.text.primary }}>{entity.friendly_name}</div>
            <div className="text-[10px] mt-0.5" style={{ color: T.text.tertiary, fontFamily: T.font.mono }}>{getStateText()}</div>
          </div>
        </div>
        {toggleable && (
          <div className="flex-shrink-0 ml-2">
            {isOn ? (
              <ToggleRight className="w-5 h-5" style={{ color }} />
            ) : (
              <ToggleLeft className="w-5 h-5" style={{ color: T.text.tertiary }} />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// ─── Scene Card ──────────────────────────────────────────────────────────────

const SceneCard = ({ scene, onActivate }) => {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={() => { setActive(true); onActivate(scene.id); setTimeout(() => setActive(false), 2000); }}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 text-center group"
      style={{
        background: active ? `${T.accent.blue}15` : T.bg.card,
        border: `1px solid ${active ? T.accent.blue + "40" : T.border.subtle}`,
        minWidth: 100,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
        style={{
          background: active ? `${T.accent.blue}25` : `rgba(255,255,255,0.04)`,
          transform: active ? "scale(1.1)" : "scale(1)",
        }}
      >
        <scene.icon className="w-5 h-5" style={{ color: active ? T.accent.blue : T.text.secondary }} />
      </div>
      <span className="text-[11px] font-medium" style={{ color: active ? T.accent.blue : T.text.secondary }}>{scene.name}</span>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: HOME
// ═══════════════════════════════════════════════════════════════════════════════

const HomeModule = ({ entities, setEntities }) => {
  const [selectedArea, setSelectedArea] = useState("all");

  const toggleEntity = (entityId) => {
    setEntities((prev) =>
      prev.map((e) => {
        if (e.entity_id !== entityId) return e;
        const newState = (() => {
          switch (e.domain) {
            case "light": case "switch": case "fan": return e.state === "on" ? "off" : "on";
            case "lock": return e.state === "locked" ? "unlocked" : "locked";
            case "cover": return e.state === "closed" ? "open" : "closed";
            default: return e.state === "on" ? "off" : "on";
          }
        })();
        return { ...e, state: newState };
      })
    );
  };

  const filtered = selectedArea === "all" ? entities : entities.filter((e) => e.area === selectedArea);
  const controllable = filtered.filter((e) => ["light", "switch", "fan", "lock", "cover", "media_player", "climate"].includes(e.domain));
  const sensors = filtered.filter((e) => ["sensor", "binary_sensor"].includes(e.domain));
  const lightsOn = entities.filter((e) => e.domain === "light" && e.state === "on").length;
  const totalLights = entities.filter((e) => e.domain === "light").length;
  const allLocked = entities.filter((e) => e.domain === "lock").every((e) => e.state === "locked");

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Status Bar */}
      <div className="flex items-center gap-6 flex-wrap">
        <StatCard label="Lights On" value={`${lightsOn}/${totalLights}`} icon={Lightbulb} color={T.accent.yellow} />
        <StatCard label="Indoor Temp" value="74.2" unit="°F" icon={Thermometer} color={T.accent.blue} />
        <StatCard label="Outdoor" value="101.4" unit="°F" icon={SunMedium} color={T.accent.orange} trend="up" trendValue="+3°" />
        <StatCard label="Security" value={allLocked ? "Secured" : "Check"} icon={Shield} color={allLocked ? T.accent.green : T.accent.red} />
      </div>

      {/* Quick Scenes */}
      <div>
        <SectionHeader title="Quick Actions" subtitle="Tap to activate a scene" />
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {MOCK_SCENES.map((scene) => (
            <SceneCard key={scene.id} scene={scene} onActivate={(id) => console.log("Activate:", id)} />
          ))}
        </div>
      </div>

      {/* Area Filter */}
      <div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setSelectedArea("all")}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all"
            style={{
              background: selectedArea === "all" ? `${T.accent.blue}20` : T.bg.card,
              color: selectedArea === "all" ? T.accent.blue : T.text.secondary,
              border: `1px solid ${selectedArea === "all" ? T.accent.blue + "40" : T.border.subtle}`,
            }}
          >
            All Rooms
          </button>
          {MOCK_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
              style={{
                background: selectedArea === area.id ? `${T.accent.blue}20` : T.bg.card,
                color: selectedArea === area.id ? T.accent.blue : T.text.secondary,
                border: `1px solid ${selectedArea === area.id ? T.accent.blue + "40" : T.border.subtle}`,
              }}
            >
              <area.icon className="w-3 h-3" />
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Controllable Devices */}
      {controllable.length > 0 && (
        <div>
          <SectionHeader title="Devices" subtitle={`${controllable.length} in ${selectedArea === "all" ? "all rooms" : MOCK_AREAS.find((a) => a.id === selectedArea)?.name}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {controllable.map((entity) => (
              <EntityCard key={entity.entity_id} entity={entity} onToggle={toggleEntity} />
            ))}
          </div>
        </div>
      )}

      {/* Sensors */}
      {sensors.length > 0 && (
        <div>
          <SectionHeader title="Sensors" subtitle="Live readings" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sensors.map((entity) => (
              <EntityCard key={entity.entity_id} entity={entity} onToggle={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: ENERGY
// ═══════════════════════════════════════════════════════════════════════════════

const EnergyModule = () => {
  const totalConsumption = ENERGY_DATA.reduce((s, d) => s + d.consumption, 0).toFixed(1);
  const totalSolar = ENERGY_DATA.reduce((s, d) => s + d.solar, 0).toFixed(1);
  const netGrid = (totalConsumption - totalSolar).toFixed(1);
  const cost = (netGrid * 0.12).toFixed(2);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-3 py-2 rounded-xl" style={{ background: T.bg.base, border: `1px solid ${T.border.medium}` }}>
        <div className="text-[10px] mb-1" style={{ color: T.text.tertiary }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="text-[11px] flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}: {p.value} kWh
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Consumption" value={totalConsumption} unit="kWh" icon={Zap} color={T.accent.blue} trend="down" trendValue="-8%" />
        <StatCard label="Solar Production" value={totalSolar} unit="kWh" icon={SunMedium} color={T.accent.yellow} trend="up" trendValue="+12%" />
        <StatCard label="Grid Import" value={netGrid > 0 ? netGrid : "0"} unit="kWh" icon={Plug} color={T.accent.orange} />
        <StatCard label="Estimated Cost" value={`$${cost}`} icon={TrendingDown} color={T.accent.green} trend="down" trendValue="-$0.40" />
      </div>

      {/* Energy Chart */}
      <Card className="p-5">
        <SectionHeader title="Today's Energy Flow" subtitle="Consumption vs Solar Production" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={ENERGY_DATA}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent.yellow} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.accent.yellow} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.accent.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: T.text.tertiary, fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: T.text.tertiary, fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="solar" stroke={T.accent.yellow} fill="url(#solarGrad)" strokeWidth={2} name="Solar" />
              <Area type="monotone" dataKey="consumption" stroke={T.accent.blue} fill="url(#consumptionGrad)" strokeWidth={2} name="Usage" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Device Breakdown */}
      <Card className="p-5">
        <SectionHeader title="Device Breakdown" subtitle="Top consumers today" />
        <div className="space-y-3">
          {ENERGY_DEVICES.map((device) => (
            <div key={device.name} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${device.color}12` }}>
                <device.icon className="w-3.5 h-3.5" style={{ color: device.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: T.text.primary }}>{device.name}</span>
                  <span className="text-[11px]" style={{ color: T.text.secondary, fontFamily: T.font.mono }}>{device.kwh} kWh</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${device.pct}%`, background: device.color }} />
                </div>
              </div>
              <span className="text-[10px] w-8 text-right flex-shrink-0" style={{ color: T.text.tertiary }}>{device.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: CAMERAS
// ═══════════════════════════════════════════════════════════════════════════════

const CamerasModule = () => {
  const [selectedCam, setSelectedCam] = useState(null);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <StatCard label="Cameras Online" value="4/4" icon={Cctv} color={T.accent.green} />
        <StatCard label="Detections Today" value="4" icon={Eye} color={T.accent.purple} />
        <StatCard label="Storage Used" value="42" unit="GB" icon={Database} color={T.accent.blue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_CAMERAS.map((cam) => (
          <Card
            key={cam.id}
            onClick={() => setSelectedCam(cam.id === selectedCam ? null : cam.id)}
            className="overflow-hidden"
            style={{
              borderColor: selectedCam === cam.id ? T.accent.blue + "40" : T.border.subtle,
            }}
          >
            {/* Camera Feed Placeholder */}
            <div
              className="relative flex items-center justify-center"
              style={{
                height: selectedCam === cam.id ? 320 : 180,
                background: "linear-gradient(135deg, #0f0f14, #12121a)",
                transition: "height 0.3s ease",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Cctv className="w-8 h-8 mx-auto mb-2" style={{ color: T.text.muted }} />
                  <span className="text-[10px]" style={{ color: T.text.tertiary }}>Connect HA for live feed</span>
                </div>
              </div>
              {/* Status overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge color={cam.status === "recording" ? T.accent.red : T.text.tertiary}>
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: cam.status === "recording" ? T.accent.red : T.text.tertiary, animation: cam.status === "recording" ? "pulse 2s infinite" : "none" }} />
                  {cam.status === "recording" ? "REC" : "IDLE"}
                </Badge>
                <Badge color={T.text.secondary}>{cam.fps} FPS</Badge>
              </div>
              {cam.detections > 0 && (
                <div className="absolute top-3 right-3">
                  <Badge color={T.accent.purple}>{cam.detections} detection{cam.detections > 1 ? "s" : ""}</Badge>
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: T.text.primary }}>{cam.name}</span>
                <span className="text-[10px]" style={{ color: T.text.tertiary }}>{cam.lastEvent}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Event Timeline */}
      <Card className="p-5">
        <SectionHeader title="Recent Events" subtitle="AI-detected activity" />
        <div className="space-y-3">
          {[
            { time: "3:22 PM", cam: "Front Yard", type: "Person", confidence: 94, color: T.accent.purple },
            { time: "2:45 PM", cam: "Driveway", type: "Vehicle", confidence: 91, color: T.accent.blue },
            { time: "1:15 PM", cam: "Front Yard", type: "Person", confidence: 88, color: T.accent.purple },
            { time: "12:30 PM", cam: "Front Yard", type: "Person", confidence: 96, color: T.accent.purple },
            { time: "11:42 AM", cam: "Back Yard", type: "Cat", confidence: 72, color: T.accent.yellow },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 4 ? `1px solid ${T.border.subtle}` : "none" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${event.color}12` }}>
                <Eye className="w-3.5 h-3.5" style={{ color: event.color }} />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-medium" style={{ color: T.text.primary }}>{event.type} detected</span>
                <span className="text-[10px] ml-2" style={{ color: T.text.tertiary }}>{event.cam}</span>
              </div>
              <Badge color={event.color}>{event.confidence}%</Badge>
              <span className="text-[10px]" style={{ color: T.text.tertiary, fontFamily: T.font.mono }}>{event.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const AutomationsModule = () => {
  const [automations, setAutomations] = useState(MOCK_AUTOMATIONS);
  const [showBuilder, setShowBuilder] = useState(false);

  const toggleAutomation = (id) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, state: a.state === "on" ? "off" : "on" } : a));
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <SectionHeader title="Automations" subtitle={`${automations.filter((a) => a.state === "on").length} of ${automations.length} active`} />
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ background: `${T.accent.blue}15`, color: T.accent.blue, border: `1px solid ${T.accent.blue}30` }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Automation
        </button>
      </div>

      {/* Automation Builder (Simplified) */}
      {showBuilder && (
        <Card className="p-5" style={{ borderColor: T.accent.blue + "30" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: T.text.primary }}>New Automation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Trigger", icon: Zap, color: T.accent.yellow, placeholder: "When this happens...", options: ["State change", "Time", "Sun event", "Device trigger", "Webhook"] },
              { label: "Condition", icon: Shield, color: T.accent.purple, placeholder: "Only if...", options: ["State is", "Time is between", "Zone", "Numeric above/below"] },
              { label: "Action", icon: Play, color: T.accent.green, placeholder: "Then do this...", options: ["Call service", "Send notification", "Delay", "Wait for trigger", "Choose"] },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${step.color}12` }}>
                    <step.icon className="w-3 h-3" style={{ color: step.color }} />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: step.color }}>{step.label}</span>
                </div>
                <select
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: T.bg.input, color: T.text.secondary, border: `1px solid ${T.border.subtle}` }}
                >
                  <option value="">{step.placeholder}</option>
                  {step.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowBuilder(false)} className="px-4 py-2 rounded-xl text-xs" style={{ color: T.text.secondary }}>Cancel</button>
            <button className="px-4 py-2 rounded-xl text-xs font-medium" style={{ background: T.accent.blue, color: "#000" }}>Create</button>
          </div>
        </Card>
      )}

      {/* Automation List */}
      <div className="space-y-2">
        {automations.map((auto) => (
          <Card key={auto.id} className="p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => toggleAutomation(auto.id)} className="flex-shrink-0">
                {auto.state === "on" ? (
                  <ToggleRight className="w-5 h-5" style={{ color: T.accent.green }} />
                ) : (
                  <ToggleLeft className="w-5 h-5" style={{ color: T.text.tertiary }} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: auto.state === "on" ? T.text.primary : T.text.tertiary }}>{auto.alias}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: T.text.tertiary }}>
                    <Zap className="w-2.5 h-2.5" /> {auto.trigger}
                  </span>
                  <ChevronRight className="w-2.5 h-2.5" style={{ color: T.text.muted }} />
                  <span className="text-[10px] flex items-center gap-1" style={{ color: T.text.tertiary }}>
                    <Play className="w-2.5 h-2.5" /> {auto.action}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px]" style={{ color: T.text.tertiary, fontFamily: T.font.mono }}>
                  <Clock className="w-2.5 h-2.5 inline mr-1" />
                  {timeAgo(auto.last_triggered)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: SYSTEM (Settings + Connection Status)
// ═══════════════════════════════════════════════════════════════════════════════

const SystemModule = () => {
  const [haUrl, setHaUrl] = useState("");
  const [haToken, setHaToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected | testing | connected | error

  const testConnection = async () => {
    if (!haUrl || !haToken) return;
    setConnectionStatus("testing");
    // In production: fetch(`${haUrl}/api/`, { headers: { Authorization: `Bearer ${haToken}` } })
    setTimeout(() => setConnectionStatus(Math.random() > 0.3 ? "connected" : "error"), 1500);
  };

  const services = [
    { name: "Home Assistant", status: connectionStatus === "connected" ? "online" : "offline", detail: connectionStatus === "connected" ? "v2026.3.2 — 20 entities" : "Not connected", icon: Home, color: T.accent.blue },
    { name: "Frigate NVR", status: "offline", detail: "Not configured", icon: Cctv, color: T.accent.purple },
    { name: "MQTT Broker", status: "offline", detail: "Not configured", icon: Router, color: T.accent.green },
    { name: "Ollama (Local AI)", status: "offline", detail: "Not configured", icon: Bot, color: T.accent.yellow },
    { name: "Claude API", status: "online", detail: "Sonnet 4 — ready", icon: Sparkles, color: T.accent.purple },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* HA Connection */}
      <Card className="p-5">
        <SectionHeader title="Home Assistant Connection" subtitle="Connect Nexus to your HA instance" />
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-medium mb-1 block" style={{ color: T.text.tertiary }}>HA URL</label>
            <input
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              placeholder="http://homeassistant.local:8123"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
              style={{ background: T.bg.input, color: T.text.primary, border: `1px solid ${T.border.subtle}`, fontFamily: T.font.mono }}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium mb-1 block" style={{ color: T.text.tertiary }}>Long-Lived Access Token</label>
            <input
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              placeholder="eyJ..."
              type="password"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
              style={{ background: T.bg.input, color: T.text.primary, border: `1px solid ${T.border.subtle}`, fontFamily: T.font.mono }}
            />
            <p className="text-[10px] mt-1" style={{ color: T.text.tertiary }}>
              HA Profile → Long-Lived Access Tokens → Create Token
            </p>
          </div>
          <button
            onClick={testConnection}
            disabled={!haUrl || !haToken || connectionStatus === "testing"}
            className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: connectionStatus === "connected" ? `${T.accent.green}20` : connectionStatus === "error" ? `${T.accent.red}20` : `${T.accent.blue}15`,
              color: connectionStatus === "connected" ? T.accent.green : connectionStatus === "error" ? T.accent.red : T.accent.blue,
              border: `1px solid ${connectionStatus === "connected" ? T.accent.green + "30" : connectionStatus === "error" ? T.accent.red + "30" : T.accent.blue + "30"}`,
              opacity: !haUrl || !haToken ? 0.4 : 1,
            }}
          >
            {connectionStatus === "testing" ? "Testing..." : connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Connection Failed — Retry" : "Test Connection"}
          </button>
        </div>
      </Card>

      {/* Service Status */}
      <Card className="p-5">
        <SectionHeader title="Services" subtitle="System health overview" />
        <div className="space-y-2">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${svc.color}10` }}>
                <svc.icon className="w-4 h-4" style={{ color: svc.color }} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: T.text.primary }}>{svc.name}</div>
                <div className="text-[10px]" style={{ color: T.text.tertiary }}>{svc.detail}</div>
              </div>
              <Badge color={svc.status === "online" ? T.accent.green : T.text.tertiary}>{svc.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Mac Mini Info */}
      <Card className="p-5">
        <SectionHeader title="Hardware" subtitle="Mac Mini M4 — The Brain" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "CPU", value: "Apple M4", icon: Cpu },
            { label: "Memory", value: "16 GB", icon: Layers },
            { label: "Docker", value: "Running", icon: Database },
            { label: "Uptime", value: "14d 6h", icon: Clock },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: T.bg.card }}>
              <item.icon className="w-3.5 h-3.5" style={{ color: T.text.tertiary }} />
              <div>
                <div className="text-[10px]" style={{ color: T.text.tertiary }}>{item.label}</div>
                <div className="text-[11px] font-medium" style={{ color: T.text.primary, fontFamily: T.font.mono }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT BAY — Claude Chat Slide-Over
// ═══════════════════════════════════════════════════════════════════════════════

const AgentBay = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey Rick. I'm connected to Nexus. I can control your home, check energy, manage cameras, or trigger automations. What do you need?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setThinking(true);

    // Mock agent response — in production this hits /api/agent/chat
    setTimeout(() => {
      const responses = {
        default: "Got it. In production, this routes through the Agent Bay API (/api/agent/chat) which sends your message to Claude with HA tool definitions. Claude can then call services, read states, create automations — all against your live HA instance.",
      };
      const lower = userMsg.toLowerCase();
      let response = responses.default;
      if (lower.includes("light")) response = "I'd toggle the lights for you. With HA connected, I call `light.turn_on` or `light.turn_off` via the REST API. Connect HA in System settings to go live.";
      if (lower.includes("lock")) response = "Security first. I'd call `lock.lock` on all your lock entities. Connect HA in System settings to enable real device control.";
      if (lower.includes("temperature") || lower.includes("temp")) response = "Your indoor temp is 74.2°F, outdoor is 101.4°F. AC is set to 72°F and actively cooling. Want me to adjust?";
      if (lower.includes("good night") || lower.includes("sleep")) response = "Running Good Night routine: All lights off, doors locked, AC set to 68°F, cameras armed. Sleep well.";
      if (lower.includes("energy") || lower.includes("power")) response = "Today's energy: 20.0 kWh consumed, 18.9 kWh solar. Net grid import: 1.1 kWh ($0.13). HVAC is your biggest consumer at 42%.";
      if (lower.includes("camera") || lower.includes("detection")) response = "4 cameras online, 4 detections today. Last event: person detected on Front Yard 12 minutes ago (94% confidence). No anomalies.";
      if (lower.includes("deploy")) response = "I'd trigger a Vercel deploy via the deploy hook. The MCP server exposes this as a tool so you can also say 'Hey Nabu, deploy the latest build' through HA Assist.";

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setThinking(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex" style={{ width: 420 }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="relative ml-auto h-full flex flex-col" style={{ width: 420, background: T.bg.deep, borderLeft: `1px solid ${T.border.subtle}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${T.accent.purple}15` }}>
              <Bot className="w-4 h-4" style={{ color: T.accent.purple }} />
            </div>
            <div>
              <span className="text-xs font-semibold" style={{ color: T.text.primary }}>Agent Bay</span>
              <span className="text-[10px] ml-2" style={{ color: T.accent.green }}>Online</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <X className="w-4 h-4" style={{ color: T.text.secondary }} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
                style={{
                  background: msg.role === "user" ? `${T.accent.blue}15` : T.bg.card,
                  color: msg.role === "user" ? "#93C5FD" : T.text.secondary,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.role === "user" ? 16 : 4,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-1 px-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.text.tertiary, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 flex flex-wrap gap-1" style={{ borderTop: `1px solid ${T.border.subtle}` }}>
          {["Lights off", "Lock up", "Good night", "Check cameras", "Energy report"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => { setInput(cmd); }}
              className="px-2.5 py-1 rounded-lg text-[10px] transition-all hover:bg-white/5"
              style={{ border: `1px solid ${T.border.subtle}`, color: T.text.tertiary }}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${T.border.subtle}` }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Control your home..."
              className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none"
              style={{ background: T.bg.input, color: T.text.primary, border: `1px solid ${T.border.subtle}`, fontFamily: T.font.body }}
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: input.trim() ? `linear-gradient(135deg, ${T.accent.blue}, #3B82F6)` : T.bg.input }}
            >
              <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? "#fff" : T.text.tertiary }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE (⌘K)
// ═══════════════════════════════════════════════════════════════════════════════

const CommandPalette = ({ isOpen, onClose, onNavigate, onAgentCommand }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (isOpen) { setQuery(""); inputRef.current?.focus(); } }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { id: "home", label: "Go to Home", icon: Home, type: "nav", module: "home" },
    { id: "energy", label: "Go to Energy", icon: Zap, type: "nav", module: "energy" },
    { id: "cameras", label: "Go to Cameras", icon: Camera, type: "nav", module: "cameras" },
    { id: "automations", label: "Go to Automations", icon: Workflow, type: "nav", module: "automations" },
    { id: "system", label: "Go to System", icon: Settings, type: "nav", module: "system" },
    { id: "lights_off", label: "Turn off all lights", icon: Lightbulb, type: "action" },
    { id: "lock_all", label: "Lock all doors", icon: Lock, type: "action" },
    { id: "good_night", label: "Good Night routine", icon: Moon, type: "action" },
    { id: "agent", label: "Open Agent Bay", icon: Bot, type: "agent" },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: T.bg.base, border: `1px solid ${T.border.medium}`, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
          <Search className="w-4 h-4" style={{ color: T.text.tertiary }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 text-sm outline-none"
            style={{ background: "transparent", color: T.text.primary, fontFamily: T.font.body }}
          />
          <kbd className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: T.bg.elevated, color: T.text.tertiary }}>ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                if (cmd.type === "nav") onNavigate(cmd.module);
                if (cmd.type === "action") onAgentCommand(cmd.label);
                if (cmd.type === "agent") onAgentCommand("");
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/5"
            >
              <cmd.icon className="w-4 h-4" style={{ color: T.text.tertiary }} />
              <span className="text-xs" style={{ color: T.text.primary }}>{cmd.label}</span>
              <Badge color={cmd.type === "nav" ? T.accent.blue : cmd.type === "action" ? T.accent.green : T.accent.purple} size="sm">
                {cmd.type === "nav" ? "Navigate" : cmd.type === "action" ? "Action" : "Agent"}
              </Badge>
            </button>
          ))}
          {filtered.length === 0 && query && (
            <button
              onClick={() => { onAgentCommand(query); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5"
            >
              <Bot className="w-4 h-4" style={{ color: T.accent.purple }} />
              <span className="text-xs" style={{ color: T.text.primary }}>Ask Agent: "{query}"</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════

const MODULES = [
  { id: "home", label: "Home", icon: Home },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "system", label: "System", icon: Settings },
];

export default function NexusOS() {
  const [activeModule, setActiveModule] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentOpen, setAgentOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [entities, setEntities] = useState(MOCK_ENTITIES);
  const [time, setTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setAgentOpen((p) => !p); }
      if (e.key === "Escape") { setCommandOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "home": return <HomeModule entities={entities} setEntities={setEntities} />;
      case "energy": return <EnergyModule />;
      case "cameras": return <CamerasModule />;
      case "automations": return <AutomationsModule />;
      case "system": return <SystemModule />;
      default: return null;
    }
  };

  const lightsOn = entities.filter((e) => e.domain === "light" && e.state === "on").length;

  return (
    <div className="h-screen flex" style={{ background: T.bg.deep, color: T.text.primary, fontFamily: T.font.body }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col h-full transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarOpen ? 220 : 64,
          background: T.bg.base,
          borderRight: `1px solid ${T.border.subtle}`,
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14" style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
          {sidebarOpen && (
            <span className="text-sm tracking-[0.25em] font-extralight" style={{ fontFamily: T.font.display, color: T.text.primary }}>
              NEXUS
            </span>
          )}
          <button onClick={() => setSidebarOpen((p) => !p)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" style={{ color: T.text.tertiary }} /> : <PanelLeft className="w-4 h-4" style={{ color: T.text.tertiary }} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {MODULES.map((mod) => {
            const active = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? `${T.accent.blue}12` : "transparent",
                  color: active ? T.accent.blue : T.text.secondary,
                }}
              >
                <mod.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="text-xs font-medium">{mod.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Agent Bay Button */}
        <div className="px-2 pb-3">
          <button
            onClick={() => setAgentOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: agentOpen ? `${T.accent.purple}15` : T.bg.card,
              color: agentOpen ? T.accent.purple : T.text.secondary,
              border: `1px solid ${agentOpen ? T.accent.purple + "30" : T.border.subtle}`,
            }}
          >
            <Bot className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && (
              <>
                <span className="text-xs font-medium">Agent Bay</span>
                <kbd className="ml-auto text-[9px] px-1.5 py-0.5 rounded" style={{ background: T.bg.elevated, color: T.text.muted }}>⌘J</kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-between px-6 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold" style={{ fontFamily: T.font.display }}>
              {MODULES.find((m) => m.id === activeModule)?.label}
            </h1>
            <div className="flex items-center gap-2">
              <Badge color={T.accent.green}>HA Mock</Badge>
              <Badge color={T.accent.yellow}>{lightsOn} lights on</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] transition-all hover:bg-white/5"
              style={{ border: `1px solid ${T.border.subtle}`, color: T.text.tertiary }}
            >
              <Search className="w-3 h-3" />
              Search
              <kbd className="text-[9px] px-1 py-0.5 rounded" style={{ background: T.bg.elevated, color: T.text.muted }}>⌘K</kbd>
            </button>
            {/* Clock */}
            <span className="text-xs tabular-nums" style={{ color: T.text.tertiary, fontFamily: T.font.mono }}>
              {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg hover:bg-white/5">
              <Bell className="w-4 h-4" style={{ color: T.text.secondary }} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ background: T.accent.red }} />
            </button>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto" style={{ background: `linear-gradient(180deg, ${T.bg.base}, ${T.bg.deep})` }}>
          {renderModule()}
        </div>
      </div>

      {/* ─── Overlays ─────────────────────────────────────────────────── */}
      <AgentBay isOpen={agentOpen} onClose={() => setAgentOpen(false)} />
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
        onAgentCommand={(cmd) => { setAgentOpen(true); }}
      />

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
