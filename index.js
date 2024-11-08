const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("./routes/authRoutes");
const blogRouter = require("./routes/blogRoutes");
const commentRouter = require("./routes/commentRoutes");
const cookieParser = require("cookie-parser");

var cors = require("cors");
const { errorHandler } = require("./controllers/errorController");
const app = express();

// middleware
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

//database connect
const dbURI =
  "mongodb+srv://hiencastoo:cgO7UQW3367rJr4N@cluster0.p2laz.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("connected");
    app.listen(3000);
  })
  .catch((err) => console.log(err));
// routes

// app.get("/", (req, res) => {
//   res.render("home");
// });
// app.get("/smoothies", requireAuth, (req, res) => {
//   res.render("smoothies");
// });

app.use(authRouter);
app.use("/v1/blog", blogRouter);
app.use("/v1/comment", commentRouter);
app.use(errorHandler);
// VEaHNud75HKdjWbf
//cgO7UQW3367rJr4N
