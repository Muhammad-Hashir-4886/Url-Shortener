import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    heading: {
        color: "#277ddf",
        textAlign: 'center',
        fontSize: 45,
        marginVertical: 20,
        fontWeight: "bold"
    },
    listCont: {
        marginHorizontal: "5%",
        marginVertical: "2%"
    },
    listBox: {
        backgroundColor: "#e0e0e0",
        marginBottom: 25,
        padding: 10,
        paddingLeft: 15,
        borderRadius: 10,
        elevation: 7,
        borderWidth: 1,
        borderColor: "#b5b3b3",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        position: "relative"
    },
    shortUrl: {
        color: "#1379d8",
        fontSize: 17,
        fontWeight: "600",
        textDecorationLine: "underline"
    },
    longUrl: {
        fontSize: 10,
        marginTop: 5
    },
    deleteIcon: {
        position: "absolute",
        top: -13,
        right: -13
    }
});

export default styles