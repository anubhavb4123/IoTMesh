import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Workflow, Plus, Trash2, ChevronDown, Zap,
  Thermometer, Droplets, Wind, Gauge, Waves, CloudRain,
  PersonStanding, DoorOpen, Lightbulb, Fan, Lock, Tv,
  Refrigerator, ToggleLeft, ArrowRight, Check, Edit2, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { useSensorData } from "@/hooks/useSensorData";
import { firebaseService, ControlData, database } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
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

const SENSOR_OPTIONS = [
  { value: "temperature", label: "Temperature (°C)", icon: Thermometer },
  { value: "humidity", label: "Humidity (%)", icon: Droplets },
  { value: "gas", label: "Air Quality (PPM)", icon: Wind },
  { value: "pressure", label: "Pressure (hPa)", icon: Gauge },
  { value: "WaterLevel", label: "Water Level (cm)", icon: Waves },
  { value: "rain", label: "Rain Detection", icon: CloudRain },
  { value: "motion", label: "PIR Motion", icon: PersonStanding },
  { value: "door", label: "Door Reed Switch", icon: DoorOpen },
  { value: "power", label: "Power Grid Status", icon: Zap },
];

const OPERATORS = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "At least (>=)" },
  { value: "<=", label: "At most (<=)" },
  { value: "==", label: "Equals (==)" },
  { value: "!=", label: "Not equal (!=)" },
];

const BOOL_OPERATORS = [
  { value: "==", label: "is active / open" },
  { value: "!=", label: "is clear / closed" },
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
  { value: "on", label: "Turn ON / Energize" },
  { value: "off", label: "Turn OFF / De-energize" },
];

const BOOL_SENSORS = ["rain", "motion", "door"];
const POWER_SENSOR = "power";
const AUTOMATION_PATH = "home/room1/automations";

function isBoolSensor(sensor: string) {
  return BOOL_SENSORS.includes(sensor);
}

function isPowerSensor(sensor: string) {
  return sensor === POWER_SENSOR;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

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
        className="w-full appearance-none rounded-xl border border-black/[0.08] bg-[#edece8] px-3 py-2 text-xs font-bold text-[#18191c] outline-none transition-all focus:border-[#18191c] focus:bg-white cursor-pointer shadow-inner"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-[#18191c]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#797a82] pointer-events-none" />
    </div>
  );
}

export default function Automation() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { sensorData } = useSensorData();

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

  const saveRules = async (updated: AutomationRule[]) => {
    const obj: Record<string, AutomationRule> = {};
    updated.forEach((r) => { obj[r.id] = r; });
    await set(ref(database, AUTOMATION_PATH), obj);
  };

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
      toast.error("Add at least one trigger condition");
      sounds.error();
      return;
    }
    if (editingRule.actions.length === 0) {
      toast.error("Add at least one device action");
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
    toast.success(existing >= 0 ? "Rule updated successfully" : "Automation rule saved");
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

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
              Smart Automations
            </h1>
            <p className="text-xs text-[#797a82] mt-0.5">
              Event-driven rules linking sensor telemetry triggers to hardware actuation
            </p>
          </div>

          {!isCreating && (
            <button
              onClick={startCreating}
              className="clay-btn-dark flex items-center gap-2 text-xs self-start md:self-auto"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Automation</span>
            </button>
          )}
        </div>

        {/* ── Editor Card ── */}
        {editingRule && (
          <div className="clay-card p-6 space-y-6 border border-black/[0.1] shadow-xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <h2 className="text-sm font-bold text-[#18191c]">
                {isCreating ? "Create New Automation Rule" : "Edit Automation Rule"}
              </h2>
              <button
                onClick={() => { setEditingRule(null); setIsCreating(false); }}
                className="text-xs text-[#797a82] hover:text-[#18191c] font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Rule Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#55565d]">Rule Name</label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                placeholder="e.g. Turn on Room 1 fan when temperature exceeds 32°C"
                className="w-full rounded-xl border border-black/[0.08] bg-[#edece8] px-3.5 py-2.5 text-xs font-bold text-[#18191c] outline-none focus:border-[#18191c] focus:bg-white placeholder:text-[#9b9a94] shadow-inner"
              />
            </div>

            {/* IF Triggers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#18191c] text-white uppercase font-mono">
                  IF (Triggers)
                </span>
                <span className="text-xs text-[#797a82]">When all conditions match</span>
              </div>

              <div className="space-y-2 pl-3 border-l-2 border-black/[0.1]">
                {editingRule.conditions.map((c, i) => {
                  const isBool = isBoolSensor(c.sensor);
                  const isPower = isPowerSensor(c.sensor);
                  const operators = (isBool || isPower) ? BOOL_OPERATORS : OPERATORS;

                  return (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <div className="w-48">
                        <Select
                          value={c.sensor}
                          onChange={(v) => {
                            const conds = [...editingRule.conditions];
                            conds[i] = { ...c, sensor: v, operator: "==", value: isBoolSensor(v) ? "true" : isPowerSensor(v) ? "1" : "30" };
                            setEditingRule({ ...editingRule, conditions: conds });
                          }}
                          options={SENSOR_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                        />
                      </div>

                      <div className="w-36">
                        <Select
                          value={c.operator}
                          onChange={(v) => {
                            const conds = [...editingRule.conditions];
                            conds[i] = { ...c, operator: v };
                            setEditingRule({ ...editingRule, conditions: conds });
                          }}
                          options={operators}
                        />
                      </div>

                      <div className="flex-1 min-w-[120px]">
                        {isPower ? (
                          <Select
                            value={c.value}
                            onChange={(v) => {
                              const conds = [...editingRule.conditions];
                              conds[i] = { ...c, value: v };
                              setEditingRule({ ...editingRule, conditions: conds });
                            }}
                            options={[
                              { value: "0", label: "Inverter 🔋" },
                              { value: "1", label: "Grid Power ⚡" },
                            ]}
                          />
                        ) : isBool ? (
                          <Select
                            value={c.value}
                            onChange={(v) => {
                              const conds = [...editingRule.conditions];
                              conds[i] = { ...c, value: v };
                              setEditingRule({ ...editingRule, conditions: conds });
                            }}
                            options={[
                              { value: "true", label: "Detected / Open" },
                              { value: "false", label: "Clear / Closed" },
                            ]}
                          />
                        ) : (
                          <input
                            type="number"
                            value={c.value}
                            onChange={(e) => {
                              const conds = [...editingRule.conditions];
                              conds[i] = { ...c, value: e.target.value };
                              setEditingRule({ ...editingRule, conditions: conds });
                            }}
                            placeholder="Threshold"
                            className="w-full rounded-xl border border-black/[0.08] bg-[#edece8] px-3 py-2 text-xs font-mono font-bold text-[#18191c] outline-none focus:border-[#18191c] focus:bg-white shadow-inner"
                          />
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const conds = editingRule.conditions.filter((_, j) => j !== i);
                          setEditingRule({ ...editingRule, conditions: conds });
                        }}
                        className="p-2 rounded-lg text-[#797a82] hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    setEditingRule({
                      ...editingRule,
                      conditions: [...editingRule.conditions, { sensor: "temperature", operator: ">", value: "30" }],
                    });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#18191c] hover:underline pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add condition
                </button>
              </div>
            </div>

            {/* THEN Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#18191c] text-white uppercase font-mono">
                  THEN (Actions)
                </span>
                <span className="text-xs text-[#797a82]">Execute these commands</span>
              </div>

              <div className="space-y-2 pl-3 border-l-2 border-black/[0.1]">
                {editingRule.actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <div className="w-56">
                      <Select
                        value={a.device}
                        onChange={(v) => {
                          const acts = [...editingRule.actions];
                          acts[i] = { ...a, device: v };
                          setEditingRule({ ...editingRule, actions: acts });
                        }}
                        options={DEVICE_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
                      />
                    </div>

                    <div className="w-44">
                      <Select
                        value={a.action}
                        onChange={(v) => {
                          const acts = [...editingRule.actions];
                          acts[i] = { ...a, action: v };
                          setEditingRule({ ...editingRule, actions: acts });
                        }}
                        options={ACTION_OPTIONS}
                      />
                    </div>

                    <button
                      onClick={() => {
                        const acts = editingRule.actions.filter((_, j) => j !== i);
                        setEditingRule({ ...editingRule, actions: acts });
                      }}
                      className="p-2 rounded-lg text-[#797a82] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setEditingRule({
                      ...editingRule,
                      actions: [...editingRule.actions, { device: "room1Light", action: "on" }],
                    });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#18191c] hover:underline pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add action
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={() => { setEditingRule(null); setIsCreating(false); }}
                className="clay-btn text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveRule}
                className="clay-btn-dark text-xs"
              >
                Save Automation
              </button>
            </div>
          </div>
        )}

        {/* ── Active Automations List ── */}
        <div className="space-y-3">
          {rules.length === 0 && !isCreating ? (
            <div className="clay-card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#edece8] flex items-center justify-center text-[#18191c] mx-auto shadow-inner">
                <Workflow className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#18191c]">No automations configured</p>
              <p className="text-xs text-[#797a82] max-w-sm mx-auto">
                Create event-driven rules to trigger fans, lights, or relays automatically based on temperature, motion, or sensor levels.
              </p>
              <button onClick={startCreating} className="clay-btn-dark text-xs mt-2 inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4 mr-1.5" /> Create First Rule
              </button>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.06] transition-all shadow-sm hover:shadow-md",
                  !rule.enabled && "opacity-60 bg-white/50"
                )}
              >
                {/* Left: Switch + Name + Summary */}
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={cn("clay-switch shrink-0", rule.enabled && "checked")}
                  >
                    <span className="clay-switch-thumb" />
                  </button>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-[#18191c] truncate">{rule.name || "Untitled Rule"}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#797a82] font-mono font-bold flex-wrap">
                      <span>{rule.conditions.length} trigger{rule.conditions.length !== 1 ? "s" : ""}</span>
                      <span>→</span>
                      <span>{rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingRule({ ...rule }); setIsCreating(false); }}
                    className="p-2 rounded-xl text-[#797a82] hover:text-[#18191c] hover:bg-[#edece8] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 rounded-xl text-[#797a82] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
}
