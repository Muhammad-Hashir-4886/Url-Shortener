import express from "express";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Important for API

app.listen(5000, () => {
    console.log("server is running on port 3000")
});