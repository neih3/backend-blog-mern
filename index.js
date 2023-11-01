const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");

const app = express();

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
//view engine
app.set("view engine", "ejs");

//database connect
const dbURI =
  "mongodb+srv://hiencastoo:HbSWQHyFmcPAZyEJ@cluster0.m8ytfpy.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));
// routes
app.get("*", checkUser); //moi tuyen duong

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/smoothies", requireAuth, (req, res) => {
  res.render("smoothies");
});

app.use(authRouter);
