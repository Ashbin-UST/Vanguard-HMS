import { Text, TextInput, TextInputProps, View } from "react-native";
import { styles } from "./textbox.styles";
import Ionicons from "@expo/vector-icons/Ionicons";

interface TextboxProps extends TextInputProps {
  label: string;
  icon?: any;
}

export function Textbox({ label, icon, ...props }: TextboxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon ? <Ionicons name={icon} size={20} style={styles.icon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor="#8a8a8a"
          {...props}
        />
      </View>
    </View>
  );
}