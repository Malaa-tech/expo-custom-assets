import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import Rive from "rive-react-native";

export default function App() {
  const [animation, setAnimation] = useState("bouncing");

  return (
    <View style={styles.container}>
      <Text>Rive truk example</Text>
      <StatusBar style="auto" />
      <Rive
        resourceName="truck_v7"
        animationName={animation}
        autoplay
        style={{
          width: 200,
          height: 20,
          flex: 0,
          borderRadius: 100,
        }}
      />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        <Button
          onPress={() =>
            setAnimation("windshield_wipers")}
          title="Windshield wipers"
        />
        <Button
          onPress={() =>
            setAnimation("broken")
          }
          title="Broken"
        />
        <Button onPress={() => setAnimation("idle")} title="Idle" />
        <Button onPress={() => setAnimation("bouncing")} title="Bouncing" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
});
