import { View, Text, FlatList, Linking } from 'react-native'
import React from 'react'
import styles from './styles'
import Icon from "react-native-vector-icons/MaterialIcons";

const Home = () => {

  const data = [
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
    {shortCode: 'hashir', url: 'https://github.com/Muhammad-Hashir-4886'},
  ];

  const OpenUrl = (url: string) => {
    console.log("Url pressed")
    Linking.openURL(url)
  };
  
  const editIconPress = () => {
    console.log("Edit Icon Pressed")
  };

  const deleteIconPress = () => {
    console.log("Delete Icon Pressed")
  }

  return (
    <View>
      <Text style={styles.heading}>Short Url's</Text>
      <FlatList
      numColumns={1}
      contentContainerStyle={styles.listCont}
      data={data}
      renderItem={({item}) => (
        <View style={styles.listBox}>

          <View>
            <Text 
          onPress={() => OpenUrl(item.url)}
          style={styles.shortUrl}
          >https://{item.shortCode}.com</Text>

          <Text 
          numberOfLines={1}
          style={styles.longUrl}
          >{item.url}</Text>
          </View>

          <Icon 
          name='edit' 
          size={27} 
          color={"green"} 
          onPress={editIconPress}
          />
          <Icon 
          name='delete' 
          color={"red"} 
          size={30} 
          style={styles.deleteIcon}
          onPress={deleteIconPress}
          />

        </View>
      )}
      />
    </View>
  )
}

export default Home