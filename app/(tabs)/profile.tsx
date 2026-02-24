import {useAuthStore} from "@/store/auth-store";
import {Button, StyleSheet, View} from "react-native";

export default function AuthScreen() {
  const {signout} = useAuthStore();

  return (
    <View style={styles.container}>
      <Button title="Sign Out" onPress={signout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: "center", alignItems: "center"},
});
