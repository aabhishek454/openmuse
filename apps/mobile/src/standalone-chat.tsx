import { Plus, Send, Settings } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ApiSettings } from "./settings";
import { chatComplete, type ChatTurn } from "./direct-chat";
import { colors, IconButton, Mascot, s } from "./ui";

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: "row", marginBottom: 10, paddingHorizontal: 4 },
  userRow: { justifyContent: "flex-end" },
  userBubble: {
    backgroundColor: colors.blueDark,
    borderRadius: 20,
    borderTopRightRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 15,
    maxWidth: "86%",
  },
  userText: { color: "#FFF", fontSize: 15, lineHeight: 22 },
  botBubble: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 15,
    maxWidth: "86%",
  },
  botText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFF",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15.5,
    maxHeight: 120,
  },
  send: {
    backgroundColor: colors.blueDark,
    borderRadius: 24,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: "#BBD8F0" },
});

export function StandaloneChat({
  settings,
  onOpenSettings,
}: {
  settings: ApiSettings;
  onOpenSettings: () => void;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef<ScrollView>(null);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const history: ChatTurn[] = [...turns, { role: "user", content: text }];
    setTurns(history);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const reply = await chatComplete(settings, history);
      setTurns((current) => [...current, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [busy, draft, settings, turns]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
          gap: 10,
        }}
      >
        <Mascot size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, letterSpacing: -0.4 }}>
            OpenMuse
          </Text>
          <Text numberOfLines={1} style={[s.small]}>
            {busy ? "Thinking…" : settings.model}
          </Text>
        </View>
        <IconButton icon={Plus} label="Start a new chat" onPress={() => setTurns([])} />
        <IconButton icon={Settings} label="Open API settings" onPress={onOpenSettings} />
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 12, paddingBottom: 18 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {turns.length === 0 && !busy && (
          <View style={{ alignItems: "center", gap: 16, paddingTop: 90 }}>
            <Mascot size={64} variant="sand" />
            <Text style={s.muted}>Ask me anything — I run on your API key.</Text>
          </View>
        )}
        {turns.map((turn, index) => (
          <View key={index} style={[styles.bubbleRow, turn.role === "user" && styles.userRow]}>
            <View style={turn.role === "user" ? styles.userBubble : styles.botBubble}>
              <Text style={turn.role === "user" ? styles.userText : styles.botText}>{turn.content}</Text>
            </View>
          </View>
        ))}
        {busy && (
          <View style={[styles.bubbleRow]}>
            <View style={styles.botBubble}>
              <ActivityIndicator color={colors.blueDark} />
            </View>
          </View>
        )}
        {!!error && (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: "#FBF1F0",
              borderRadius: 16,
              padding: 13,
              marginHorizontal: 4,
              marginBottom: 8,
            }}
          >
            <Text style={[s.text, { color: colors.danger }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Message"
          value={draft}
          onChangeText={setDraft}
          placeholder="Message OpenMuse…"
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={busy || !draft.trim()}
          onPress={() => void send()}
          style={({ pressed }) => [
            styles.send,
            (busy || !draft.trim()) && styles.sendDisabled,
            pressed && { transform: [{ scale: 0.96 }] },
          ]}
        >
          <Send size={19} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
