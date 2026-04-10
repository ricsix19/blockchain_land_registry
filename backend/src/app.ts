import express from "express";
import authRouter from "./routes/auth.js";
import propertiesRouter from "./routes/properties.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/properties", propertiesRouter);

export default app;
