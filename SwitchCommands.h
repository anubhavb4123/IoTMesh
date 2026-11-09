#pragma once

#include <Firebase_ESP_Client.h>
#include <esp_timer.h>
#include <sys/time.h>

namespace SwitchCommands {
constexpr uint64_t MaxLifetimeMs = 15000;
constexpr uint32_t ClockValidAfter = 1609459200UL;
constexpr size_t IdLength = 20;

struct Command {
  char id[IdLength + 1];
  uint64_t issuedAt;
  bool value;
  int speed;
};

inline uint64_t nowMs() {
  timeval now;
  gettimeofday(&now, nullptr);
  if (now.tv_sec < ClockValidAfter) return 0;
  return uint64_t(now.tv_sec) * 1000 + now.tv_usec / 1000;
}

inline bool isNumber(const FirebaseJsonData &field) {
  return field.typeNum >= FirebaseJson::JSON_INT && field.typeNum <= FirebaseJson::JSON_DOUBLE;
}

inline bool read(FirebaseJson &json, const String &eventPath, const char *channel,
                 const char *lastId, uint64_t lastIssuedAt, Command &command) {
  const String key(channel);
  const bool snapshot = eventPath == "/";
  if (!snapshot && eventPath != "/" + key) return false;
  const String prefix = snapshot ? key + "/" : "";
  FirebaseJsonData field;

  if (!json.get(field, prefix + "id") || field.typeNum != FirebaseJson::JSON_STRING ||
      field.stringValue.length() != IdLength || field.stringValue == lastId) return false;
  field.stringValue.toCharArray(command.id, sizeof(command.id));
  if (!json.get(field, prefix + "value") || field.typeNum != FirebaseJson::JSON_BOOL) return false;
  command.value = field.boolValue;

  if (!json.get(field, prefix + "issuedAt") || !isNumber(field)) return false;
  const double issuedAt = field.doubleValue;
  if (!json.get(field, prefix + "expiresAt") || !isNumber(field)) return false;
  const double expiresAt = field.doubleValue;
  const uint64_t now = nowMs();
  if (!now || issuedAt < lastIssuedAt || expiresAt <= now || expiresAt <= issuedAt ||
      expiresAt - issuedAt > MaxLifetimeMs || issuedAt > now + 1000) return false;
  const uint64_t bootTime = now - esp_timer_get_time() / 1000;
  // A reconnect can deliver the latest command again. A new boot must never
  // replay an earlier boot's command even if it is still within its lifetime.
  if (issuedAt < bootTime) return false;

  command.issuedAt = uint64_t(issuedAt);
  command.speed = -1;
  if (json.get(field, prefix + "speed")) {
    if (!isNumber(field) || field.doubleValue != field.intValue || field.intValue < 0 || field.intValue > 5) {
      return false;
    }
    command.speed = field.intValue;
  }
  return true;
}

inline void addAcknowledgment(FirebaseJson &json, const char *channel, const char *commandId, bool applied) {
  if (commandId[0]) {
    const String ack = String(channel) + "Ack/";
    json.set(ack + "commandId", commandId);
    json.set(ack + "outcome", applied ? "applied" : "rejected");
  }
}

inline void addReport(FirebaseJson &json, const char *channel, bool value,
                      int speed, const char *commandId, bool applied) {
  const String prefix = String(channel) + "/";
  json.set(prefix + "value", value);
  if (speed >= 0) json.set(prefix + "speed", speed);
  addAcknowledgment(json, channel, commandId, applied);
}
}
