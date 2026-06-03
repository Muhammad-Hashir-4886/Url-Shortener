import {StyleSheet} from "react-native"

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#277ddf",
        flex: 1
    },
    subCont: {
        marginTop: 45,
        backgroundColor: "#FFFFFF",
        flex: 1,
        borderTopLeftRadius: 45,
        borderTopRightRadius: 45
    },
    heading: {
        color: "#FFFFFF",
        textAlign: 'center',
        fontSize: 60,
        fontWeight: 'bold'
    },
    form: {
        // paddingHorizontal: "2%",
        marginTop: 90
    },
    label: {
        textAlign: 'left',
        marginLeft: "8%",
        fontWeight: "bold"
    },
    inputBox: {
        borderWidth: 1,
        width: '85%',
        marginHorizontal: 'auto',
        marginBottom: 20,
        borderColor: "#277ddf",
        borderRadius: 13
    }, 
    button: {
        backgroundColor: "#277ddf",
        paddingVertical: 15,
        width: "87%",
        marginHorizontal: "auto",
        borderRadius: 27
    },
    btnText: {
        textAlign: "center",
        fontSize: 17,
        color: "#FFFFFF",
        fontWeight: "bold"
    },
    footer: {
        textAlign: "center",
        marginTop: 5
    },
    innerFooter: {
        color: "#1379d8"
    }
});

export default styles