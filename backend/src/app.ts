import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import propertiesRouter from "./routes/properties.js";
import purchaseRequestsRouter from "./routes/purchaseRequests.js";
import usersRouter from "./routes/users.js";

const app = express();
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: false,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/purchase-requests", purchaseRequestsRouter);
app.use("/properties", propertiesRouter);

export default app;
