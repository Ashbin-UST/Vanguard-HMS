import { Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { styles } from "./textbox.styles";
import Ionicons from "@expo/vector-icons/Ionicons";

interface TextboxProps extends TextInputProps {
  label: string;
  icon?: any;
  error?: string;
  /** When provided, the whole field becomes a tap target (used for picker fields). */
  onPress?: () => void;
}

export function Textbox({ label, icon, error, onPress, ...props }: TextboxProps) {
  const inner = (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : undefined]}>
        {icon ? <Ionicons name={icon} size={20} style={styles.icon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor="#8a8a8a"
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.container}>{inner}</View>;
}