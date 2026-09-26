import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView as RNSafeAreaView, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type ApiSettings } from "./src/settings";
import { StandaloneChat } from "./src/standalone-chat";
import { Button, Card, colors, Field, Mascot, s } from "./src/ui";

export default function App() {
  const [settings, setSettings] = useState<ApiSettings | undefined>();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void loadSettings().then((loaded) => {
      setSettings(loaded);
      setReady(true);
    });
  }, []);

  if (!ready || !settings)
    return (
      <RNSafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.blueDark} style={{ marginTop: 120 }} />
      </RNSafeAreaView>
    );

  if (editing || !settings.apiKey)
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <ScrollView
            style={{ width: "100%" }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            <SettingsScreen
              initial={settings}
              canCancel={!!settings.apiKey}
              onDone={(next) => {
                setSettings(next);
                setEditing(false);
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
        <StandaloneChat settings={settings} onOpenSettings={() => setEditing(true)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function SettingsScreen({
  initial,
  canCancel,
  onDone,
}: {
  initial: ApiSettings;
  canCancel: boolean;
  onDone: (next: ApiSettings) => void;
}) {
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const trimmedKey = apiKey.trim();
  return (
    <View style={{ width: "100%", maxWidth: 420, alignSelf: "center", gap: 22, alignItems: "center" }}>
      <Mascot size={72} />
      <Text style={{ fontSize: 32, color: colors.text, letterSpacing: -1, fontWeight: "500" }}>
        Welcome to OpenMuse.
      </Text>
      <Text style={[s.muted, { textAlign: "center" }]}>A little room for your day.</Text>
      <Card style={{ width: "100%" }}>
        <Field
          label="API base URL"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://openrouter.ai/api/v1"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Field
          label="API key"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-or-v1-…"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Field
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder="openrouter/auto"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          primary
          disabled={!trimmedKey || !baseUrl.trim()}
          onPress={() =>
            void saveSettings({
              baseUrl: baseUrl.trim(),
              apiKey: trimmedKey,
              model: model.trim(),
            }).then(() =>
              onDone({
                baseUrl: baseUrl.trim(),
                apiKey: trimmedKey,
                model: model.trim() || DEFAULT_SETTINGS.model,
              }),
            )
          }
        >
          Start chatting
        </Button>
        {canCancel && (
          <Button small style={{ marginTop: 10 }} onPress={() => onDone(initial)}>
            Cancel
          </Button>
        )}
        <Text style={[s.small, { marginTop: 15 }]}>
          Works with OpenRouter (openrouter.ai/keys) and any OpenAI-compatible API — just paste the base
          URL, your key, and a model name. Everything stays on this phone.
        </Text>
      </Card>
    </View>
  );
}
