import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Workflow, Plus, Trash2, ChevronDown, Zap, Power,
  Thermometer, Droplets, Wind, Gauge, Waves, CloudRain,
  PersonStanding, DoorOpen, BatteryCharging,
  Lightbulb, Fan, Lock, Tv, Refrigerator, ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { useSensorData } from "@/hooks/useSensorData";
import { firebaseService, ControlData } from "@/lib/firebase";
import { database, PATHS } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";

// ── Types ──
interface Condition {
  sensor: string;
  operator: string;
  value: string;
}

interface Action {
  device: string;
  action: string;
}

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Condition[];
  actions: Action[];
}

// ── Options ──
const SENSOR_OPTIONS = [
  { value: "temperature", label: "Temperature (°C)", icon: Thermometer },
  { value: "humidity", label: "Humidity (%)", icon: Droplets },
  { value: "gas", label: "Air Quality (PPM)", icon: Wind },
  { value: "pressure", label: "Pressure (hPa)", icon: Gauge },
  { value: "WaterLevel", label: "Water Level (cm)", icon: Waves },
  { value: "rain", label: "Rain", icon: CloudRain },
  { value: "motion", label: "Motion", icon: PersonStanding },
  { value: "door", label: "Door", icon: DoorOpen },
  { value: "power", label: "Power Source", icon: Zap },
];

const OPERATORS = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "==", label: "==" },
  { value: "!=", label: "!=" },
];

const BOOL_OPERATORS = [
  { value: "==", label: "is" },
  { value: "!=", label: "is not" },
];

const DEVICE_OPTIONS = [
  { value: "room1Light", label: "Room 1 Light", icon: Lightbulb },
  { value: "room1Fan", label: "Room 1 Fan", icon: Fan },
  { value: "room1Switch", label: "Room 1 Switch", icon: ToggleLeft },
  { value: "room2Light", label: "Room 2 Light", icon: Lightbulb },
  { value: "room2Fan", label: "Room 2 Fan", icon: Fan },
  { value: "room2Switch", label: "Room 2 Switch", icon: ToggleLeft },
  { value: "room3Light", label: "Room 3 Light", icon: Lightbulb },
  { value: "room3Fan", label: "Room 3 Fan", icon: Fan },
  { value: "room3Switch", label: "Room 3 Switch", icon: ToggleLeft },
  { value: "lobbyLight", label: "Lobby Light", icon: Lightbulb },
  { value: "lobbyFan", label: "Lobby Fan", icon: Fan },
  { value: "lobbyTV", label: "Lobby TV", icon: Tv },
  { value: "refrigerator", label: "Refrigerator", icon: Refrigerator },
  { value: "relay1", label: "Relay 1", icon: Zap },
  { value: "relay2", label: "Relay 2", icon: Zap },
  { value: "relay3", label: "Relay 3", icon: Zap },
  { value: "relay4", label: "Relay 4", icon: Zap },
  { value: "lock", label: "Door Lock", icon: Lock },
];

const ACTION_OPTIONS = [
  { value: "on", label: "Turn ON" },
  { value: "off", label: "Turn OFF" },
];

const BOOL_SENSORS = ["rain", "motion", "door"];
const POWER_SENSOR = "power";
const AUTOMATION_PATH = "home/room1/automations";

// ── Helpers ──
function isBoolSensor(sensor: string) {
  return BOOL_SENSORS.includes(sensor);
}

function isPowerSensor(sensor: string) {
  return sensor === POWER_SENSOR;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Custom Select ──
function Select({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition-all focus:border-cyan-400/50 focus:bg-white/8 cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0a0e1a] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
    </div>
  );
}

// ── Condition Row ──
function ConditionRow({ condition, onChange, onRemove, index }: {
  condition: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
  index: number;
}) {
  const isBool = isBoolSensor(condition.sensor);
  const isPower = isPowerSensor(condition.sensor);
  const operators = (isBool || isPower) ? BOOL_OPERATORS : OPERATORS;
  const sensorIcon = SENSOR_OPTIONS.find(s => s.value === condition.sensor);
  const Icon = sensorIcon?.icon || Zap;

  return (
    <div
      className="flex items-center gap-2 flex-wrap animate-in"
      style={{ animation: `fadeSlideIn 0.3s ease both ${index * 0.05}s` }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 shrink-0">
        <Icon className="h-4 w-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-[120px]">
        <Select
          value={condition.sensor}
          onChange={(v) => onChange({ ...condition, sensor: v, operator: "==", value: isBoolSensor(v) ? "true" : isPowerSensor(v) ? "1" : condition.value })}
          options={SENSOR_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
          placeholder="Select sensor"
        />
      </div>
      <div className="w-[80px]">
        <Select
          value={condition.operator}
          onChange={(v) => onChange({ ...condition, operator: v })}
          options={operators}
        />
      </div>
      <div className="flex-1 min-w-[80px]">
        {isPower ? (
          <Select
            value={condition.value}
            onChange={(v) => onChange({ ...condition, value: v })}
            options={[
              { value: "0", label: "Inverter 🔋" },
              { value: "1", label: "Grid ⚡" },
            ]}
          />
        ) : isBool ? (
          <Select
            value={condition.value}
            onChange={(v) => onChange({ ...condition, value: v })}
            options={[
              { value: "true", label: "Detected / Open" },
              { value: "false", label: "Clear / Closed" },
            ]}
          />
        ) : (
          <input
            type="number"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Value"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition-all focus:border-cyan-400/50"
          />
        )}
      </div>
      <button
        onClick={() => { onRemove(); haptic.tick(); sounds.click(); }}
        className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400/60 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Action Row ──
function ActionRow({ action, onChange, onRemove, index }: {
  action: Action;
  onChange: (a: Action) => void;
  onRemove: () => void;
  index: number;
}) {
  const deviceIcon = DEVICE_OPTIONS.find(d => d.value === action.device);
  const Icon = deviceIcon?.icon || Zap;

  return (
    <div
      className="flex items-center gap-2 flex-wrap animate-in"
      style={{ animation: `fadeSlideIn 0.3s ease both ${index * 0.05}s` }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 shrink-0">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <Select
          value={action.device}
          onChange={(v) => onChange({ ...action, device: v })}
          options={DEVICE_OPTIONS.map(d => ({ value: d.value, label: d.label }))}
          placeholder="Select device"
        />
      </div>
      <div className="w-[120px]">
        <Select
          value={action.action}
          onChange={(v) => onChange({ ...action, action: v })}
          options={ACTION_OPTIONS}
        />
      </div>
      <button
        onClick={() => { onRemove(); haptic.tick(); sounds.click(); }}
        className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400/60 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function Automation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { sensorData } = useSensorData();

  // Load from Firebase
  useEffect(() => {
    const unsub = onValue(ref(database, AUTOMATION_PATH), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.values(data).map((rule: any) => ({
          ...rule,
          conditions: rule.conditions ? (Array.isArray(rule.conditions) ? rule.conditions : Object.values(rule.conditions)) : [],
          actions: rule.actions ? (Array.isArray(rule.actions) ? rule.actions : Object.values(rule.actions)) : [],
        })) as AutomationRule[];
        setRules(arr);
      } else {
        setRules([]);
      }
    });
    return () => unsub();
  }, []);

  // Save to Firebase
  const saveRules = async (updated: AutomationRule[]) => {
    const obj: Record<string, AutomationRule> = {};
    updated.forEach((r) => { obj[r.id] = r; });
    await set(ref(database, AUTOMATION_PATH), obj);
  };

  // Evaluate rules against live sensor data
  useEffect(() => {
    if (!sensorData || rules.length === 0) return;

    rules.forEach(async (rule) => {
      if (!rule.enabled) return;
      if (rule.conditions.length === 0 || rule.actions.length === 0) return;

      const allMet = rule.conditions.every((c) => {
        const raw = (sensorData as any)[c.sensor];
        if (raw === undefined || raw === null) return false;
        const sensorVal = typeof raw === "boolean" ? raw : Number(raw);
        const targetVal = c.value === "true" ? true : c.value === "false" ? false : Number(c.value);

        switch (c.operator) {
          case ">": return sensorVal > targetVal;
          case "<": return sensorVal < targetVal;
          case ">=": return sensorVal >= targetVal;
          case "<=": return sensorVal <= targetVal;
          case "==": return sensorVal == targetVal;
          case "!=": return sensorVal != targetVal;
          default: return false;
        }
      });

      if (allMet) {
        for (const a of rule.actions) {
          const val = a.action === "on";
          await firebaseService.updateSwitchState(a.device as keyof ControlData, val);
        }
      }
    });
  }, [sensorData, rules]);

  // Create new rule
  const startCreating = () => {
    setEditingRule({
      id: newId(),
      name: "",
      enabled: true,
      conditions: [{ sensor: "temperature", operator: ">", value: "35" }],
      actions: [{ device: "room1Fan", action: "on" }],
    });
    setIsCreating(true);
    haptic.medium();
    sounds.click();
  };

  const saveRule = async () => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) {
      toast.error("Please enter a rule name");
      sounds.error();
      return;
    }
    if (editingRule.conditions.length === 0) {
      toast.error("Add at least one condition");
      sounds.error();
      return;
    }
    if (editingRule.actions.length === 0) {
      toast.error("Add at least one action");
      sounds.error();
      return;
    }

    const existing = rules.findIndex((r) => r.id === editingRule.id);
    let updated: AutomationRule[];
    if (existing >= 0) {
      updated = [...rules];
      updated[existing] = editingRule;
    } else {
      updated = [...rules, editingRule];
    }
    await saveRules(updated);
    setEditingRule(null);
    setIsCreating(false);
    haptic.heavy();
    sounds.success();
    toast.success(existing >= 0 ? "Rule updated!" : "Automation created!");
  };

  const deleteRule = async (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    await saveRules(updated);
    haptic.medium();
    sounds.click();
    toast.success("Rule deleted");
  };

  const toggleRule = async (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    await saveRules(updated);
    haptic.tick();
    sounds.click();
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setIsCreating(false);
    haptic.tick();
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-400/10 border border-violet-400/20">
              <Workflow className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create Automation</h1>
              <p className="text-xs text-muted-foreground/50 mt-0.5 tracking-wide">
                {rules.length} rule{rules.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>

          {!isCreating && (
            <Button
              onClick={startCreating}
              className="gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </Button>
          )}
        </div>

        {/* ── Editor ── */}
        {editingRule && (
          <Card
            className="border-violet-400/20 bg-card/60 backdrop-blur-sm overflow-hidden"
            style={{ animation: "fadeSlideIn 0.4s ease both" }}
          >
            {/* Editor header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-violet-400/10 bg-violet-400/5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ boxShadow: "0 0 6px #8b5cf6" }} />
              <span className="text-[10px] font-semibold tracking-widest text-violet-300/70 uppercase">
                {isCreating ? "New Automation Rule" : "Edit Rule"}
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Rule name */}
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                placeholder="Rule name (e.g. Cool room when hot)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-all focus:border-violet-400/50 focus:bg-white/8 placeholder:text-white/20"
              />

              {/* IF section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest text-amber-400 uppercase px-2 py-1 rounded-md bg-amber-400/10 border border-amber-400/20">
                    IF
                  </span>
                  <span className="text-[11px] text-muted-foreground/40">All conditions must be true</span>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-amber-400/20 ml-3">
                  {editingRule.conditions.map((c, i) => (
                    <ConditionRow
                      key={i}
                      index={i}
                      condition={c}
                      onChange={(updated) => {
                        const conds = [...editingRule.conditions];
                        conds[i] = updated;
                        setEditingRule({ ...editingRule, conditions: conds });
                      }}
                      onRemove={() => {
                        const conds = editingRule.conditions.filter((_, j) => j !== i);
                        setEditingRule({ ...editingRule, conditions: conds });
                      }}
                    />
                  ))}
                  <button
                    onClick={() => {
                      setEditingRule({
                        ...editingRule,
                        conditions: [...editingRule.conditions, { sensor: "temperature", operator: ">", value: "30" }],
                      });
                      haptic.tick();
                    }}
                    className="flex items-center gap-1.5 text-xs text-amber-400/60 hover:text-amber-400 transition-colors mt-1 px-2 py-1 rounded-md hover:bg-amber-400/5"
                  >
                    <Plus className="h-3 w-3" /> Add condition
                  </button>
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-3 px-4">
                <div className="flex-1 h-px bg-gradient-to-r from-amber-400/20 to-transparent" />
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <ChevronDown className="h-3 w-3 text-white/30" />
                  <span className="text-[10px] text-white/30 font-medium tracking-wider">THEN</span>
                  <ChevronDown className="h-3 w-3 text-white/30" />
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-emerald-400/20 to-transparent" />
              </div>

              {/* THEN section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase px-2 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20">
                    THEN
                  </span>
                  <span className="text-[11px] text-muted-foreground/40">Execute these actions</span>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-emerald-400/20 ml-3">
                  {editingRule.actions.map((a, i) => (
                    <ActionRow
                      key={i}
                      index={i}
                      action={a}
                      onChange={(updated) => {
                        const acts = [...editingRule.actions];
                        acts[i] = updated;
                        setEditingRule({ ...editingRule, actions: acts });
                      }}
                      onRemove={() => {
                        const acts = editingRule.actions.filter((_, j) => j !== i);
                        setEditingRule({ ...editingRule, actions: acts });
                      }}
                    />
                  ))}
                  <button
                    onClick={() => {
                      setEditingRule({
                        ...editingRule,
                        actions: [...editingRule.actions, { device: "room1Light", action: "on" }],
                      });
                      haptic.tick();
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors mt-1 px-2 py-1 rounded-md hover:bg-emerald-400/5"
                  >
                    <Plus className="h-3 w-3" /> Add action
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={cancelEdit} className="text-muted-foreground hover:text-white">
                  Cancel
                </Button>
                <Button
                  onClick={saveRule}
                  className="gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0"
                >
                  <Zap className="h-4 w-4" /> Save Rule
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Rules List ── */}
        {rules.length === 0 && !isCreating ? (
          <Card
            className="border-border/40 bg-card/40 p-12 text-center"
            style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-violet-400/10 border border-violet-400/20">
                <Workflow className="h-8 w-8 text-violet-400/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">No automations yet</p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  Create your first IF/THEN rule to automate your devices
                </p>
              </div>
              <Button onClick={startCreating} className="gap-2 bg-violet-500 hover:bg-violet-600 text-white border-0 mt-2">
                <Plus className="h-4 w-4" /> Create First Rule
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <Card
                key={rule.id}
                className={`border-border/40 bg-card/40 overflow-hidden transition-all duration-300 hover:border-border/60 ${
                  !rule.enabled ? "opacity-50" : ""
                }`}
                style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.05 + i * 0.05}s` }}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 shrink-0 ${
                        rule.enabled
                          ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                          : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                          rule.enabled ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{rule.name || "Unnamed Rule"}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400/80 font-medium">
                          {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] text-white/20">→</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400/80 font-medium">
                          {rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-violet-400"
                      onClick={() => {
                        setEditingRule({ ...rule });
                        setIsCreating(false);
                        haptic.tick();
                        sounds.click();
                      }}
                    >
                      <Workflow className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
