import {Button,View,Text} from "react-native"
export function BaseButton({label,...props}:TextboxProps){
    console.log(props)
  
      return (
          <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
         
            <Button title="Login">{props.label}</Button>
          </View>
        );
  }